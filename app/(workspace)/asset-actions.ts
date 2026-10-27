"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AssetNotFoundError,
  AssetPersistenceError,
  createOwnedAsset,
  updateOwnedAsset,
} from "@/lib/data-access/assets";
import { readAssetInput } from "@/lib/assets/validation";

export type AssetActionState = {
  error?: string;
};

function readUuid(value: FormDataEntryValue | null) {
  const id = String(value ?? "");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

function persistenceErrorMessage(error: unknown, operation: "created" | "updated") {
  if (error instanceof AssetPersistenceError && error.code === "42501") {
    return "Asset storage is not enabled in the connected Supabase project yet. Apply the pending asset ownership migration, then try again.";
  }
  return `Asset could not be ${operation}. Please try again.`;
}

export async function createAssetAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const campaignId = readUuid(formData.get("campaignId"));
  if (!campaignId) return { error: "This campaign identifier is invalid." };

  const input = await readAssetInput(formData);
  if ("error" in input) return input;

  let asset;
  try {
    asset = await createOwnedAsset(campaignId, input);
  } catch (error) {
    return { error: persistenceErrorMessage(error, "created") };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/assets`);
  redirect(`/campaigns/${campaignId}/assets/${asset.id}?saved=1`);
}

export async function updateAssetAction(
  _previousState: AssetActionState,
  formData: FormData,
): Promise<AssetActionState> {
  const campaignId = readUuid(formData.get("campaignId"));
  const assetId = readUuid(formData.get("assetId"));
  if (!campaignId || !assetId) {
    return { error: "This asset identifier is invalid." };
  }

  const input = await readAssetInput(formData);
  if ("error" in input) return input;

  let asset;
  try {
    asset = await updateOwnedAsset(campaignId, assetId, input);
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return { error: "Asset not found or you do not have access to it." };
    }
    return { error: persistenceErrorMessage(error, "updated") };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/assets`);
  revalidatePath(`/campaigns/${campaignId}/assets/${asset.id}`);
  redirect(`/campaigns/${campaignId}/assets/${asset.id}?saved=1`);
}
