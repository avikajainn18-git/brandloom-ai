import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AssetNotFoundError, getOwnedAsset } from "@/lib/data-access/assets";
import { CampaignNotFoundError, getOwnedCampaign } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Campaign asset",
};

const typeLabels = {
  email: "Email",
  advertisement: "Advertisement",
  social_post: "Social post",
  landing_page: "Landing page",
  other: "Other",
} as const;

export default async function AssetDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; assetId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id, assetId }, query] = await Promise.all([params, searchParams]);
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
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/campaigns/${campaign.id}/assets`}
          className="inline-flex items-center text-sm font-medium text-[#62625e] transition-colors hover:text-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <ArrowLeft size={16} className="mr-2" />
          All campaign assets
        </Link>
        <Link
          href={`/campaigns/${campaign.id}/assets/${asset.id}/edit`}
          className="inline-flex shrink-0 items-center rounded-lg border px-3.5 py-2 text-sm font-medium text-[#555550] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <Pencil size={15} className="mr-2" />
          Edit
        </Link>
      </div>
      <PageHeader
        eyebrow={`${typeLabels[asset.asset_type]} · ${campaign.name}`}
        title={asset.title}
        description="Inspect the saved campaign content and its current revision."
      />
      {query.saved === "1" ? (
        <p role="status" className="rounded-lg border border-[#d5ded4] bg-[#f6faf5] px-4 py-3 text-sm text-[#456044]">
          Asset changes saved.
        </p>
      ) : null}
      <section className="rounded-xl border bg-white p-6 sm:p-8" aria-labelledby="asset-content-heading">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
          <span>{typeLabels[asset.asset_type]}</span>
          <span aria-hidden="true">·</span>
          <span>Revision {asset.current_revision}</span>
          <span aria-hidden="true">·</span>
          <span>Campaign: {campaign.name}</span>
        </div>
        <div className="mt-6">
          <h2 id="asset-content-heading" className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
            Content
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#3c3c3a]">{asset.text_content}</p>
        </div>
      </section>
    </div>
  );
}
