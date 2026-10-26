import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AssetRow = Database["public"]["Tables"]["assets"]["Row"];
type AssetClient = SupabaseClient<Database>;

export type AssetInput = {
  title: string;
  assetType: Database["public"]["Enums"]["asset_type"];
  textContent: string;
};

export class AssetNotFoundError extends Error {
  constructor() {
    super("Asset not found.");
    this.name = "AssetNotFoundError";
  }
}

export class AssetPersistenceError extends Error {
  readonly code: string | null;
  readonly operation: string;

  constructor(operation: string, code: string | null = null) {
    super("Asset persistence failed.");
    this.name = "AssetPersistenceError";
    this.code = code;
    this.operation = operation;
  }
}

const assetColumns =
  "id, campaign_id, title, asset_type, text_content, current_revision, current_revision_at, created_at, updated_at";

async function getOwnedAssetClient(): Promise<{
  client: AssetClient;
  user: User;
}> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Authentication is required to access campaign assets.");
  }

  return { client, user: data.user };
}

async function assertOwnedCampaign(
  client: AssetClient,
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
    throw new AssetNotFoundError();
  }
}

export async function listOwnedAssets(campaignId: string): Promise<AssetRow[]> {
  const { client, user } = await getOwnedAssetClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("assets")
    .select(assetColumns)
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Campaign assets could not be loaded.");
  }

  return data;
}

export async function getOwnedAsset(
  campaignId: string,
  assetId: string,
): Promise<AssetRow> {
  const { client, user } = await getOwnedAssetClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("assets")
    .select(assetColumns)
    .eq("id", assetId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error || !data) {
    throw new AssetNotFoundError();
  }

  return data;
}

export async function createOwnedAsset(
  campaignId: string,
  input: AssetInput,
): Promise<AssetRow> {
  const { client, user } = await getOwnedAssetClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("assets")
    .insert({
      campaign_id: campaignId,
      title: input.title,
      asset_type: input.assetType,
      text_content: input.textContent,
    })
    .select(assetColumns)
    .single();

  if (error || !data) {
    if (error) {
      console.error("[assets] create failed", {
        code: error.code,
        message: error.message,
      });
    }
    throw new AssetPersistenceError("create", error?.code ?? null);
  }

  return data;
}

export async function updateOwnedAsset(
  campaignId: string,
  assetId: string,
  input: AssetInput,
): Promise<AssetRow> {
  const { client, user } = await getOwnedAssetClient();
  await assertOwnedCampaign(client, user, campaignId);
  const existingAsset = await getOwnedAsset(campaignId, assetId);

  const { data, error } = await client
    .from("assets")
    .update({
      title: input.title,
      asset_type: input.assetType,
      text_content: input.textContent,
      current_revision: existingAsset.current_revision + 1,
      current_revision_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("campaign_id", campaignId)
    .select(assetColumns)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[assets] update failed", {
        code: error.code,
        message: error.message,
      });
      throw new AssetPersistenceError("update", error.code);
    }
    throw new AssetNotFoundError();
  }

  return data;
}
