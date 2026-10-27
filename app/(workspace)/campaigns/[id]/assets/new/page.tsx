import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { PageHeader } from "@/components/page-header";
import { createAssetAction } from "@/app/(workspace)/asset-actions";
import { CampaignNotFoundError, getOwnedCampaign } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "New campaign asset",
};

export default async function NewAssetPage({
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
        eyebrow={`Campaign content · ${campaign.name}`}
        title="Add a campaign asset"
        description="Submit pasted campaign text or import a .txt file. You can inspect and edit the content before it is saved."
      />
      <AssetForm action={createAssetAction} campaignId={campaign.id} />
    </div>
  );
}
