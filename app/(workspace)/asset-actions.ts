"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AssetNotFoundError,
  AssetPersistenceError,
  createOwnedAsset,
  updateOwnedAsset,
  type AssetInput,
} from "@/lib/data-access/assets";
import { MAX_ASSET_BYTES } from "@/lib/assets/constants";
import type { Database } from "@/lib/supabase/database.types";

export type AssetActionState = {
  error?: string;
};

type AssetType = Database["public"]["Enums"]["asset_type"];
type AssetFileResult =
  | { content: string | null; filename: string | null }
  | { error: string };

const assetTypes: readonly AssetType[] = [
  "email",
  "advertisement",
  "social_post",
  "landing_page",
  "other",
];

function readUuid(value: FormDataEntryValue | null) {
  const id = String(value ?? "");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

function textByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

async function readAssetFile(formData: FormData): Promise<AssetFileResult> {
  const entry = formData.get("assetFile");
  if (!(entry instanceof File) || entry.name === "") {
    return { content: null, filename: null };
  }

  if (entry.size === 0) {
    return { error: "The attached text file is empty." };
  }

  if (!entry.name.toLowerCase().endsWith(".txt")) {
    return { error: "Attach a .txt file only." };
  }
  if (entry.size > MAX_ASSET_BYTES) {
    return { error: "Text files must be 1 MiB or smaller." };
  }

  try {
    const bytes = new Uint8Array(await entry.arrayBuffer());
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!content.trim()) {
      return { error: "The attached text file is empty." };
    }
    return { content, filename: entry.name };
  } catch {
    return { error: "The attached file is not valid UTF-8 text." };
  }
}

async function readAssetInput(formData: FormData): Promise<AssetInput | { error: string }> {
  const title = String(formData.get("title") ?? "").trim();
  const assetType = String(formData.get("assetType") ?? "") as AssetType;
  const textContent = String(formData.get("textContent") ?? "");
  const fileResult = await readAssetFile(formData);

  if ("error" in fileResult) return fileResult;
  if (!title) return { error: "Enter an asset title." };
  if (title.length > 160) {
    return { error: "Asset titles must be 160 characters or fewer." };
  }
  if (!assetTypes.includes(assetType)) {
    return { error: "Choose a valid asset type." };
  }
  const content = textContent || fileResult.content || "";
  if (!content.trim()) {
    return { error: "Enter asset content or attach a non-empty .txt file." };
  }
  if (textByteLength(content) > MAX_ASSET_BYTES) {
    return { error: "Asset content must be 1 MiB or smaller." };
  }

  return { title, assetType, textContent: content };
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
