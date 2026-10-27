import type { Database } from "../supabase/database.types";
import type { AssetInput } from "../data-access/assets";
import { MAX_ASSET_BYTES } from "./constants.ts";
import { isFileEntry, readTextFile } from "./file-input.ts";

export type AssetFormInput = AssetInput;
type AssetType = Database["public"]["Enums"]["asset_type"];

const assetTypes: readonly AssetType[] = [
  "email",
  "advertisement",
  "social_post",
  "landing_page",
  "other",
];

function textByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export async function readAssetInput(
  formData: FormData,
): Promise<AssetFormInput | { error: string }> {
  const title = String(formData.get("title") ?? "").trim();
  const assetType = String(formData.get("assetType") ?? "") as AssetType;
  const textContentEntry = formData.get("textContent");
  const textContent = typeof textContentEntry === "string" ? textContentEntry : null;
  const fileEntry = formData.get("assetFile");

  if (!title) return { error: "Enter an asset title." };
  if (title.length > 160) {
    return { error: "Asset titles must be 160 characters or fewer." };
  }
  if (!assetTypes.includes(assetType)) {
    return { error: "Choose a valid asset type." };
  }

  let fileContent: string | null = null;
  if (isFileEntry(fileEntry) && fileEntry.name) {
    const fileResult = await readTextFile(fileEntry);
    if (fileResult.kind === "error") return fileResult;
    if (fileResult.kind === "success") fileContent = fileResult.content;
  }

  // The editor is authoritative whenever it is present. Imported text can be
  // edited, replaced, or cleared without falling back to stale file content.
  const content = textContent ?? fileContent ?? "";
  if (!content.trim()) {
    return { error: "Enter asset content or attach a non-empty .txt file." };
  }
  if (textByteLength(content) > MAX_ASSET_BYTES) {
    return { error: "Asset content must be 1 MiB or smaller." };
  }

  return { title, assetType, textContent: content };
}
