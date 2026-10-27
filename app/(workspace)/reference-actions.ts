"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  BrandReferenceNotFoundError,
  BrandReferencePersistenceError,
  createOwnedBrandReference,
  updateOwnedBrandReference,
  type BrandReferenceInput,
} from "@/lib/data-access/brand-references";
import type { Database } from "@/lib/supabase/database.types";

export type ReferenceActionState = {
  error?: string;
};

type ReferenceType = Database["public"]["Enums"]["brand_reference_type"];
type ApprovalStatus = Database["public"]["Enums"]["brand_reference_approval_status"];

const referenceTypes: readonly ReferenceType[] = [
  "campaign_brief",
  "brand_guidelines",
  "terminology",
  "claim",
  "fact",
  "offer",
  "other",
];

const approvalStatuses: readonly ApprovalStatus[] = [
  "pending",
  "approved",
  "rejected",
  "superseded",
];

function readUuid(value: FormDataEntryValue | null) {
  const id = String(value ?? "");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

function readReferenceInput(formData: FormData):
  | BrandReferenceInput
  | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const referenceType = String(formData.get("referenceType") ?? "") as ReferenceType;
  const content = String(formData.get("content") ?? "").trim();
  const approvalStatus = String(formData.get("approvalStatus") ?? "") as ApprovalStatus;
  const authorityValue = String(formData.get("authority") ?? "").trim();
  const precedenceValue = String(formData.get("precedence") ?? "").trim();

  if (!title) return { error: "Enter a reference title." };
  if (title.length > 160) {
    return { error: "Reference titles must be 160 characters or fewer." };
  }
  if (!referenceTypes.includes(referenceType)) {
    return { error: "Choose a valid reference type." };
  }
  if (!content) return { error: "Enter the approved reference content." };
  if (content.length > 50000) {
    return { error: "Reference content must be 50,000 characters or fewer." };
  }
  if (!approvalStatuses.includes(approvalStatus)) {
    return { error: "Choose a valid approval status." };
  }
  if (authorityValue.length > 200) {
    return { error: "Authority labels must be 200 characters or fewer." };
  }

  let precedence: number | null = null;
  if (precedenceValue) {
    if (!/^\d+$/.test(precedenceValue)) {
      return { error: "Precedence must be a non-negative whole number." };
    }
    precedence = Number(precedenceValue);
    if (!Number.isSafeInteger(precedence) || precedence > 2147483647) {
      return { error: "Precedence is outside the supported range." };
    }
  }

  return {
    title,
    referenceType,
    content,
    approvalStatus,
    authority: authorityValue || null,
    precedence,
  };
}

export async function createReferenceAction(
  _previousState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const campaignId = readUuid(formData.get("campaignId"));
  if (!campaignId) return { error: "This campaign identifier is invalid." };

  const input = readReferenceInput(formData);
  if ("error" in input) return input;

  let reference;
  try {
    reference = await createOwnedBrandReference(campaignId, input);
  } catch (error) {
    if (error instanceof BrandReferencePersistenceError && error.code === "42501") {
      return {
        error:
          "Reference storage is not enabled in the connected Supabase project yet. Apply the pending brand-reference ownership migration, then try again.",
      };
    }
    return { error: "Reference could not be created. Please try again." };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/references/${reference.id}`);
  redirect(`/campaigns/${campaignId}?reference=saved`);
}

export async function updateReferenceAction(
  _previousState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const campaignId = readUuid(formData.get("campaignId"));
  const referenceId = readUuid(formData.get("referenceId"));
  if (!campaignId || !referenceId) {
    return { error: "This reference identifier is invalid." };
  }

  const input = readReferenceInput(formData);
  if ("error" in input) return input;

  let reference;
  try {
    reference = await updateOwnedBrandReference(campaignId, referenceId, input);
  } catch (error) {
    if (error instanceof BrandReferenceNotFoundError) {
      return { error: "Reference not found or you do not have access to it." };
    }
    if (error instanceof BrandReferencePersistenceError && error.code === "42501") {
      return {
        error:
          "Reference storage is not enabled in the connected Supabase project yet. Apply the pending brand-reference ownership migration, then try again.",
      };
    }
    return { error: "Reference could not be updated. Please try again." };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/references/${reference.id}`);
  redirect(`/campaigns/${campaignId}/references/${reference.id}?saved=1`);
}
