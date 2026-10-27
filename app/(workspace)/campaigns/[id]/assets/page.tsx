import Link from "next/link";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetList } from "@/components/asset-list";
import { PageHeader } from "@/components/page-header";
import { listOwnedAssets } from "@/lib/data-access/assets";
import { CampaignNotFoundError, getOwnedCampaign } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Campaign assets",
};

export default async function CampaignAssetsPage({
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

  let assets;
  try {
    assets = await listOwnedAssets(campaign.id);
  } catch {
    return (
      <div className="space-y-8">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="inline-flex items-center text-sm font-medium text-[#62625e] transition-colors hover:text-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to {campaign.name}
        </Link>
        <PageHeader
          eyebrow={`Campaign content · ${campaign.name}`}
          title="Content assets"
          description="Campaign content could not be loaded from the connected Supabase project."
        />
        <section className="rounded-xl border border-[#e4caca] bg-[#fff8f8] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d3f3f]">Assets unavailable</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e4b4b]">
            Confirm the asset ownership migration is applied, then refresh this page.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="inline-flex items-center text-sm font-medium text-[#62625e] transition-colors hover:text-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to {campaign.name}
      </Link>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <PageHeader
          eyebrow={`Campaign content · ${campaign.name}`}
          title="Content assets"
          description="Store the email, advertisement, social, landing-page, and other text assets connected to this campaign."
        />
        <Link
          href={`/campaigns/${campaign.id}/assets/new`}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <Plus size={16} className="mr-2" />
          Add asset
        </Link>
      </div>

      {assets.length === 0 ? (
        <section className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-[var(--surface)] px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl border bg-[var(--surface-subtle)] text-[#5f5f5b]">
            <FileText size={21} strokeWidth={1.7} />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">No content assets</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#252525]">Add the first campaign asset</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
            Paste campaign content or import a UTF-8 `.txt` file, then inspect it before saving.
          </p>
          <Link
            href={`/campaigns/${campaign.id}/assets/new`}
            className="mt-6 inline-flex items-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
          >
            <Plus size={16} className="mr-2" />
            Add asset
          </Link>
        </section>
      ) : (
        <AssetList campaignId={campaign.id} assets={assets} />
      )}
    </div>
  );
}
