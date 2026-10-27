import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { PageHeader } from "@/components/page-header";
import { updateAssetAction } from "@/app/(workspace)/asset-actions";
import { AssetNotFoundError, getOwnedAsset } from "@/lib/data-access/assets";
import { CampaignNotFoundError, getOwnedCampaign } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Edit campaign asset",
};

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string; assetId: string }>;
}) {
  const { id, assetId } = await params;
  let campaign;
  let asset;

  try {
    campaign = await getOwnedCampaign(id);
    asset = await getOwnedAsset(id, assetId);
  } catch (error) {
    if (error instanceof CampaignNotFoundError || error instanceof AssetNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Campaign content · ${campaign.name}`}
        title="Edit campaign asset"
        description="Update the asset title, type, or text while advancing its current revision."
      />
      <AssetForm action={updateAssetAction} campaignId={campaign.id} asset={asset} />
    </div>
  );
}
