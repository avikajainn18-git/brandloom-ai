import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandReferenceForm } from "@/components/brand-reference-form";
import { PageHeader } from "@/components/page-header";
import { createReferenceAction } from "@/app/(workspace)/reference-actions";
import {
  CampaignNotFoundError,
  getOwnedCampaign,
} from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "New brand reference",
};

export default async function NewBrandReferencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let campaign;

  try {
    campaign = await getOwnedCampaign(id);
  } catch (error) {
    if (error instanceof CampaignNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Brand references · ${campaign.name}`}
        title="Add a brand reference"
        description="Record approved information that can later support evidence-backed campaign review."
      />
      <BrandReferenceForm action={createReferenceAction} campaignId={campaign.id} />
    </div>
  );
}
