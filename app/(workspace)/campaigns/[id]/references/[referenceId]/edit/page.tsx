import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandReferenceForm } from "@/components/brand-reference-form";
import { PageHeader } from "@/components/page-header";
import { updateReferenceAction } from "@/app/(workspace)/reference-actions";
import {
  BrandReferenceNotFoundError,
  getOwnedBrandReference,
} from "@/lib/data-access/brand-references";
import { CampaignNotFoundError, getOwnedCampaign } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Edit brand reference",
};

export default async function EditBrandReferencePage({
  params,
}: {
  params: Promise<{ id: string; referenceId: string }>;
}) {
  const { id, referenceId } = await params;
  let campaign;
  let reference;

  try {
    campaign = await getOwnedCampaign(id);
    reference = await getOwnedBrandReference(id, referenceId);
  } catch (error) {
    if (error instanceof CampaignNotFoundError || error instanceof BrandReferenceNotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Brand references · ${campaign.name}`}
        title="Edit brand reference"
        description="Update the stored approved source while preserving its explicit status, authority, and precedence."
      />
      <BrandReferenceForm
        action={updateReferenceAction}
        campaignId={campaign.id}
        reference={reference}
      />
    </div>
  );
}
