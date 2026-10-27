import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ReviewClient = SupabaseClient<Database>;

export type ReviewRunRow = Database["public"]["Tables"]["review_runs"]["Row"];
export type FindingRow = Database["public"]["Tables"]["findings"]["Row"];
export type FindingReferenceRow =
  Database["public"]["Tables"]["finding_references"]["Row"];

export type FindingWithAsset = FindingRow & {
  asset_title: string;
};

export type FindingReferenceWithTitle = FindingReferenceRow & {
  reference_title: string;
};

export class ReviewDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewDataError";
  }
}

async function getOwnedReviewClient(): Promise<{
  client: ReviewClient;
  user: User;
}> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Authentication is required to access review data.");
  }

  return { client, user: data.user };
}

async function assertOwnedCampaign(
  client: ReviewClient,
  user: User,
  campaignId: string,
) {
  const { data, error } = await client
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !data) {
    throw new ReviewDataError("Campaign not found.");
  }
}

/**
 * Fetches the most recent review run for an owned campaign.
 * Returns null if no review has been run yet.
 */
export async function getLatestReviewRun(
  campaignId: string,
): Promise<ReviewRunRow | null> {
  const { client, user } = await getOwnedReviewClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("review_runs")
    .select(
      "id, campaign_id, status, finding_count, conflict_count, error_message, started_at, completed_at, created_at, updated_at",
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ReviewDataError("Review run data could not be loaded.");
  }

  return data;
}

/**
 * Fetches all findings for a review run, joined with the affected asset title.
 */
export async function listReviewFindings(
  campaignId: string,
  reviewRunId: string,
): Promise<FindingWithAsset[]> {
  const { client, user } = await getOwnedReviewClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("findings")
    .select(
      "id, review_run_id, affected_asset_id, category, explanation, status, severity, suggested_correction, created_at, updated_at, assets!findings_affected_asset_id_fkey(title)",
    )
    .eq("review_run_id", reviewRunId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ReviewDataError("Review findings could not be loaded.");
  }

  if (!data) {
    return [];
  }

  return data.map((row) => {
  const { assets, ...finding } = row;
  const assetRelation = assets as unknown as { title: string } | null;

  return {
    ...finding,
    asset_title: assetRelation?.title ?? "Unknown asset",
  };
});
}

/**
 * Fetches all evidence references for a set of finding IDs,
 * joined with the brand reference title.
 */
export async function listFindingReferences(
  campaignId: string,
  findingIds: string[],
): Promise<FindingReferenceWithTitle[]> {
  if (findingIds.length === 0) {
    return [];
  }

  const { client, user } = await getOwnedReviewClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("finding_references")
    .select(
      "finding_id, reference_id, evidence_note, brand_references!finding_references_reference_id_fkey(title)",
    )
    .in("finding_id", findingIds);

  if (error) {
    throw new ReviewDataError("Finding evidence could not be loaded.");
  }

  if (!data) {
    return [];
  }

  return data.map((row) => {
  const { brand_references, ...ref } = row;
  const refRelation = brand_references as unknown as {
    title: string;
  } | null;

  return {
    ...ref,
    reference_title: refRelation?.title ?? "Unknown reference",
  };
});
}


/**
 * A conflict finding for the cross-campaign review queue. Includes the
 * campaign name, affected asset title, and supporting reference evidence.
 */
export type QueueConflictFinding = FindingRow & {
  campaign_id: string;
  campaign_name: string;
  asset_title: string;
  evidence: QueueEvidenceItem[];
};

export type QueueEvidenceItem = {
  reference_title: string;
  evidence_note: string | null;
};

/**
 * Returns `conflict_requires_review` findings from the latest completed
 * review run of every campaign owned by the authenticated user.
 *
 * Older runs are intentionally excluded so that a re-run that resolves
 * a conflict removes it from the queue.
 *
 * Ownership is enforced both by the application-level owner_id filter
 * and by the existing RLS policies on review_runs, findings, and
 * finding_references.
 */
export async function listConflictFindingsForQueue(): Promise<
  QueueConflictFinding[]
> {
  const { client, user } = await getOwnedReviewClient();

  // Step 1: Fetch all owned campaigns.
  const { data: campaigns, error: campaignsError } = await client
    .from("campaigns")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (campaignsError || !campaigns) {
    throw new ReviewDataError(
      "Campaigns could not be loaded for the review queue.",
    );
  }

  if (campaigns.length === 0) {
    return [];
  }

  // Step 2: For each campaign, find the latest completed review run.
  // We query all completed runs for owned campaigns, ordered newest first.
  const campaignIds = campaigns.map((c) => c.id);

  const { data: runs, error: runsError } = await client
    .from("review_runs")
    .select("id, campaign_id")
    .in("campaign_id", campaignIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (runsError) {
    throw new ReviewDataError(
      "Review runs could not be loaded for the review queue.",
    );
  }

  if (!runs || runs.length === 0) {
    return [];
  }

  // Keep only the latest completed run per campaign.
  const latestRunByCampaign = new Map<string, string>();
  for (const run of runs) {
    if (!latestRunByCampaign.has(run.campaign_id)) {
      latestRunByCampaign.set(run.campaign_id, run.id);
    }
  }

  const latestRunIds = [...latestRunByCampaign.values()];
  if (latestRunIds.length === 0) {
    return [];
  }

  // Step 3: Fetch conflict findings from those latest runs.
  const { data: conflictFindings, error: findingsError } = await client
    .from("findings")
    .select(
      "id, review_run_id, affected_asset_id, category, explanation, status, severity, suggested_correction, created_at, updated_at, assets!findings_affected_asset_id_fkey(title)",
    )
    .in("review_run_id", latestRunIds)
    .eq("status", "conflict_requires_review")
    .order("created_at", { ascending: true });

  if (findingsError) {
    throw new ReviewDataError(
      "Conflict findings could not be loaded for the review queue.",
    );
  }

  if (!conflictFindings || conflictFindings.length === 0) {
    return [];
  }

  // Step 4: Fetch evidence references for those findings.
  const findingIds = conflictFindings.map((f) => f.id);
  const { data: evidenceRows, error: evidenceError } = await client
    .from("finding_references")
    .select(
      "finding_id, reference_id, evidence_note, brand_references!finding_references_reference_id_fkey(title)",
    )
    .in("finding_id", findingIds);

  // Evidence is supplementary — a load failure is not fatal.
  const evidenceByFinding = new Map<string, QueueEvidenceItem[]>();
  if (!evidenceError && evidenceRows) {
    for (const row of evidenceRows) {
      const refRelation = row.brand_references as unknown as {
        title: string;
      } | null;
      const item: QueueEvidenceItem = {
        reference_title: refRelation?.title ?? "Unknown reference",
        evidence_note: row.evidence_note,
      };
      const list = evidenceByFinding.get(row.finding_id) ?? [];
      list.push(item);
      evidenceByFinding.set(row.finding_id, list);
    }
  }

  // Build a reverse lookup: run_id → campaign_id.
  const runToCampaign = new Map<string, string>();
  for (const [cId, rId] of latestRunByCampaign) {
    runToCampaign.set(rId, cId);
  }

  // Campaign name lookup.
  const campaignNameMap = new Map<string, string>();
  for (const c of campaigns) {
    campaignNameMap.set(c.id, c.name);
  }

  return conflictFindings.map((row) => {
    const { assets, ...finding } = row;
    const assetRelation = assets as unknown as { title: string } | null;
    const campaignId = runToCampaign.get(finding.review_run_id) ?? "";

    return {
      ...finding,
      campaign_id: campaignId,
      campaign_name: campaignNameMap.get(campaignId) ?? "Unknown campaign",
      asset_title: assetRelation?.title ?? "Unknown asset",
      evidence: evidenceByFinding.get(finding.id) ?? [],
    };
  });
}
