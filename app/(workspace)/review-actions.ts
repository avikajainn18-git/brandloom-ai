"use server";

import { revalidatePath } from "next/cache";
import {
  runOwnedCampaignReview,
  ReviewCampaignNotFoundError,
  ReviewPersistenceError,
  ReviewLoadError,
} from "@/lib/application/reviews";

export type ReviewActionState = {
  error?: string;
  success?: boolean;
};

function readCampaignId(formData: FormData) {
  const id = String(formData.get("campaignId") ?? "");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export async function runReviewAction(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const campaignId = readCampaignId(formData);
  if (!campaignId) {
    return { error: "This campaign identifier is invalid." };
  }

  try {
    await runOwnedCampaignReview(campaignId);
  } catch (error) {
    if (error instanceof ReviewCampaignNotFoundError) {
      return {
        error: "Campaign not found or you do not have access to it.",
      };
    }
    if (error instanceof ReviewLoadError) {
      return {
        error:
          "Campaign assets or references could not be loaded. Confirm the ownership migrations are applied, then try again.",
      };
    }
    if (error instanceof ReviewPersistenceError) {
      if (error.code === "42501") {
        return {
          error:
            "Review storage is not enabled in the connected Supabase project yet. Apply the pending review ownership migration, then try again.",
        };
      }
      return {
        error:
          "Review results could not be saved. Please try again.",
      };
    }
    return { error: "An unexpected error occurred while running the review." };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}
