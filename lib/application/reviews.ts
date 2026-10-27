import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { runDeterministicReview } from "@/lib/domain/review-engine";
import {
  mapReviewRecordsToInput,
  persistReviewResult,
  type FindingPersistenceInput,
  type FindingReferencePersistenceInput,
  type PersistedReviewSummary,
  type ReviewPersistencePort,
  type ReviewRunCompletionInput,
  type ReviewRunFailureInput,
  type ReviewRunPersistenceInput,
} from "@/lib/domain/review-persistence";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReviewClient = SupabaseClient<Database>;

export class ReviewCampaignNotFoundError extends Error {
  constructor() {
    super("Campaign not found.");
    this.name = "ReviewCampaignNotFoundError";
  }
}

export class ReviewPersistenceError extends Error {
  readonly operation: string;
  readonly code: string | null;

  constructor(operation: string, code: string | null = null) {
    super("Review results could not be persisted.");
    this.name = "ReviewPersistenceError";
    this.operation = operation;
    this.code = code;
  }
}

export class ReviewLoadError extends Error {
  constructor() {
    super("Review inputs could not be loaded.");
    this.name = "ReviewLoadError";
  }
}

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function errorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as SupabaseErrorLike).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as SupabaseErrorLike).message;
    return typeof message === "string" ? message : "unknown error";
  }
  return "unknown error";
}

async function getOwnedReviewClient(): Promise<{
  client: ReviewClient;
  user: User;
}> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Authentication is required to run a campaign review.");
  }

  return { client, user: data.user };
}

async function loadOwnedReviewInput(
  client: ReviewClient,
  user: User,
  campaignId: string,
) {
  const { data: campaign, error: campaignError } = await client
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (campaignError || !campaign) {
    throw new ReviewCampaignNotFoundError();
  }

  const [{ data: assets, error: assetsError }, { data: references, error: referencesError }] =
    await Promise.all([
      client
        .from("assets")
        .select("id, campaign_id, title, text_content")
        .eq("campaign_id", campaignId),
      client
        .from("brand_references")
        .select("id, campaign_id, title, content, approval_status, precedence")
        .eq("campaign_id", campaignId)
        .eq("approval_status", "approved"),
    ]);

  if (assetsError || referencesError || !assets || !references) {
    throw new ReviewLoadError();
  }

  return mapReviewRecordsToInput(campaignId, assets, references);
}

function createSupabasePersistencePort(client: ReviewClient): ReviewPersistencePort {
  return {
    async insertReviewRun(input: ReviewRunPersistenceInput) {
      const { error } = await client.from("review_runs").insert({
        id: input.id,
        campaign_id: input.campaignId,
        status: input.status,
        started_at: input.startedAt,
      });
      if (error) throw error;
    },

    async insertFinding(input: FindingPersistenceInput) {
      const { error } = await client.from("findings").insert({
        id: input.id,
        review_run_id: input.reviewRunId,
        affected_asset_id: input.affectedAssetId,
        category: input.category,
        explanation: input.explanation,
        status: input.status,
        severity: input.severity,
        suggested_correction: input.suggestedCorrection,
      });
      if (error) throw error;
    },

    async insertFindingReference(input: FindingReferencePersistenceInput) {
      const { error } = await client.from("finding_references").insert({
        finding_id: input.findingId,
        reference_id: input.referenceId,
        evidence_note: input.evidenceNote,
      });
      if (error) throw error;
    },

    async completeReviewRun(input: ReviewRunCompletionInput) {
      const { data, error } = await client
        .from("review_runs")
        .update({
          status: input.status,
          finding_count: input.findingCount,
          conflict_count: input.conflictCount,
          completed_at: input.completedAt,
        })
        .eq("id", input.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Review run completion did not update a row.");
    },

    async failReviewRun(input: ReviewRunFailureInput) {
      const { data, error } = await client
        .from("review_runs")
        .update({
          status: input.status,
          error_message: input.errorMessage,
          completed_at: input.completedAt,
        })
        .eq("id", input.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Review run failure status did not update a row.");
    },
  };
}

export async function runOwnedCampaignReview(
  campaignId: string,
): Promise<PersistedReviewSummary> {
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) {
    throw new ReviewCampaignNotFoundError();
  }

  const { client, user } = await getOwnedReviewClient();
  const input = await loadOwnedReviewInput(client, user, campaignId);
  const result = runDeterministicReview(input);
  const assetIds = new Set(input.assets.map((asset) => asset.id));
  const referenceIds = new Set(input.references.map((reference) => reference.id));

  try {
    return await persistReviewResult(
      createSupabasePersistencePort(client),
      campaignId,
      result,
      { assetIds, referenceIds },
    );
  } catch (error) {
    console.error("[reviews] persistence failed", {
      code: errorCode(error),
      message: errorMessage(error),
    });
    throw new ReviewPersistenceError("persist", errorCode(error));
  }
}
