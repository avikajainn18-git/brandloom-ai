import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type BrandReferenceRow = Database["public"]["Tables"]["brand_references"]["Row"];
type BrandReferenceClient = SupabaseClient<Database>;

export type BrandReferenceInput = {
  title: string;
  referenceType: Database["public"]["Enums"]["brand_reference_type"];
  content: string;
  approvalStatus: Database["public"]["Enums"]["brand_reference_approval_status"];
  authority: string | null;
  precedence: number | null;
};

export class BrandReferenceNotFoundError extends Error {
  constructor() {
    super("Brand reference not found.");
    this.name = "BrandReferenceNotFoundError";
  }
}

const brandReferenceColumns =
  "id, campaign_id, title, reference_type, content, approval_status, authority, precedence, created_at, updated_at";

async function getOwnedReferenceClient(): Promise<{
  client: BrandReferenceClient;
  user: User;
}> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Authentication is required to access brand references.");
  }

  return { client, user: data.user };
}

async function assertOwnedCampaign(
  client: BrandReferenceClient,
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
    throw new BrandReferenceNotFoundError();
  }
}

export async function listOwnedBrandReferences(
  campaignId: string,
): Promise<BrandReferenceRow[]> {
  const { client, user } = await getOwnedReferenceClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("brand_references")
    .select(brandReferenceColumns)
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Brand references could not be loaded.");
  }

  return data;
}

export async function getOwnedBrandReference(
  campaignId: string,
  referenceId: string,
): Promise<BrandReferenceRow> {
  const { client, user } = await getOwnedReferenceClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("brand_references")
    .select(brandReferenceColumns)
    .eq("id", referenceId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error || !data) {
    throw new BrandReferenceNotFoundError();
  }

  return data;
}

export async function createOwnedBrandReference(
  campaignId: string,
  input: BrandReferenceInput,
): Promise<BrandReferenceRow> {
  const { client, user } = await getOwnedReferenceClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("brand_references")
    .insert({
      campaign_id: campaignId,
      title: input.title,
      reference_type: input.referenceType,
      content: input.content,
      approval_status: input.approvalStatus,
      authority: input.authority,
      precedence: input.precedence,
    })
    .select(brandReferenceColumns)
    .single();

  if (error || !data) {
    throw new Error("Brand reference could not be created.");
  }

  return data;
}

export async function updateOwnedBrandReference(
  campaignId: string,
  referenceId: string,
  input: BrandReferenceInput,
): Promise<BrandReferenceRow> {
  const { client, user } = await getOwnedReferenceClient();
  await assertOwnedCampaign(client, user, campaignId);

  const { data, error } = await client
    .from("brand_references")
    .update({
      title: input.title,
      reference_type: input.referenceType,
      content: input.content,
      approval_status: input.approvalStatus,
      authority: input.authority,
      precedence: input.precedence,
    })
    .eq("id", referenceId)
    .eq("campaign_id", campaignId)
    .select(brandReferenceColumns)
    .maybeSingle();

  if (error || !data) {
    throw new BrandReferenceNotFoundError();
  }

  return data;
}
