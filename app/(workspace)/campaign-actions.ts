"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CampaignNotFoundError,
  createOwnedCampaign,
  updateOwnedCampaign,
} from "@/lib/data-access/campaigns";

export type CampaignActionState = {
  error?: string;
};

function readCampaignInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const descriptionValue = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Enter a campaign name." } as const;
  }

  if (name.length > 160) {
    return { error: "Campaign names must be 160 characters or fewer." } as const;
  }

  if (descriptionValue.length > 2000) {
    return { error: "Descriptions must be 2,000 characters or fewer." } as const;
  }

  return { name, description: descriptionValue || null } as const;
}

function readCampaignId(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export async function createCampaignAction(
  _previousState: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const input = readCampaignInput(formData);
  if ("error" in input) return input;

  let campaign;
  try {
    campaign = await createOwnedCampaign(input);
  } catch {
    return { error: "Campaign could not be created. Please try again." };
  }

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignAction(
  _previousState: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const id = readCampaignId(formData);
  if (!id) return { error: "This campaign identifier is invalid." };

  const input = readCampaignInput(formData);
  if ("error" in input) return input;

  let campaign;
  try {
    campaign = await updateOwnedCampaign(id, input);
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      return { error: "Campaign not found or you do not have access to it." };
    }
    return { error: "Campaign could not be updated. Please try again." };
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaign.id}`);
  redirect(`/campaigns/${campaign.id}?saved=1`);
}
