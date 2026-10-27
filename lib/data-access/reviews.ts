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
