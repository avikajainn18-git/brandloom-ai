import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignClient = SupabaseClient<Database>;

export type CampaignInput = {
  name: string;
  description: string | null;
};

export class CampaignNotFoundError extends Error {
  constructor() {
    super("Campaign not found.");
    this.name = "CampaignNotFoundError";
  }
}

async function getOwnedCampaignClient(): Promise<{
  client: CampaignClient;
  user: User;
}> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Authentication is required to access campaigns.");
  }

  return { client, user: data.user };
}

const campaignColumns =
  "id, owner_id, name, description, status, created_at, updated_at";

export async function listOwnedCampaigns(): Promise<CampaignRow[]> {
  const { client, user } = await getOwnedCampaignClient();
  const { data, error } = await client
    .from("campaigns")
    .select(campaignColumns)
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Campaigns could not be loaded.");
  }

  return data;
}

export async function getOwnedCampaign(id: string): Promise<CampaignRow> {
  const { client, user } = await getOwnedCampaignClient();
  const { data, error } = await client
    .from("campaigns")
    .select(campaignColumns)
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !data) {
    throw new CampaignNotFoundError();
  }

  return data;
}

export async function createOwnedCampaign(input: CampaignInput): Promise<CampaignRow> {
  const { client, user } = await getOwnedCampaignClient();
  const { data, error } = await client
    .from("campaigns")
    .insert({
      owner_id: user.id,
      name: input.name,
      description: input.description,
    })
    .select(campaignColumns)
    .single();

  if (error || !data) {
    throw new Error("Campaign could not be created.");
  }

  return data;
}

export async function updateOwnedCampaign(
  id: string,
  input: CampaignInput,
): Promise<CampaignRow> {
  const { client, user } = await getOwnedCampaignClient();
  const { data, error } = await client
    .from("campaigns")
    .update({
      name: input.name,
      description: input.description,
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select(campaignColumns)
    .maybeSingle();

  if (error || !data) {
    throw new CampaignNotFoundError();
  }

  return data;
}
