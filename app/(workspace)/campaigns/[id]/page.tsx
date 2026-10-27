import Link from "next/link";
import { ArrowLeft, FileText, Pencil, Plus, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campaign-form";
import { BrandReferenceList } from "@/components/brand-reference-list";
import { PageHeader } from "@/components/page-header";
import { updateCampaignAction } from "@/app/(workspace)/campaign-actions";
import {
  CampaignNotFoundError,
  getOwnedCampaign,
} from "@/lib/data-access/campaigns";
import {
  listOwnedBrandReferences,
  type BrandReferenceRow,
} from "@/lib/data-access/brand-references";
import { listOwnedAssets, type AssetRow } from "@/lib/data-access/assets";
import { AssetList } from "@/components/asset-list";

export const metadata: Metadata = {
  title: "Campaign details",
};

export default async function CampaignDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; reference?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let campaign;
  let references: BrandReferenceRow[] = [];
  let referencesError = false;
  let assets: AssetRow[] = [];
  let assetsError = false;

  try {
    campaign = await getOwnedCampaign(id);
  } catch (error) {
    if (error instanceof CampaignNotFoundError) notFound();
    throw error;
  }

  try {
    references = await listOwnedBrandReferences(campaign.id);
  } catch {
    referencesError = true;
  }

  try {
    assets = await listOwnedAssets(campaign.id);
  } catch {
    assetsError = true;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/campaigns"
          className="inline-flex items-center text-sm font-medium text-[#62625e] transition-colors hover:text-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <ArrowLeft size={16} className="mr-2" />
          All campaigns
        </Link>
        <span className="rounded-full border bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#777771]">
          {campaign.status.replaceAll("_", " ")}
        </span>
      </div>
      <PageHeader
        eyebrow="Campaign details"
        title={campaign.name}
        description="Update campaign context and manage the approved information that supports future review."
      />
      {query.saved === "1" ? (
        <p role="status" className="rounded-lg border border-[#d5ded4] bg-[#f6faf5] px-4 py-3 text-sm text-[#456044]">
          Campaign changes saved.
        </p>
      ) : null}
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Pencil size={14} />
        Editing campaign information
      </div>
      <CampaignForm
        action={updateCampaignAction}
        campaign={{
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
        }}
      />

      <section className="space-y-5" aria-labelledby="brand-references-heading">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
              <ShieldCheck size={15} />
              Approved information
            </div>
            <h2 id="brand-references-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#252525]">
              Brand references
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Store the approved guidelines, facts, terminology, claims, and offer details for this campaign.
            </p>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/references/new`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
          >
            <Plus size={16} className="mr-2" />
            Add reference
          </Link>
        </div>

        {query.reference === "saved" ? (
          <p role="status" className="rounded-lg border border-[#d5ded4] bg-[#f6faf5] px-4 py-3 text-sm text-[#456044]">
            Reference saved.
          </p>
        ) : null}

        {referencesError ? (
          <div className="rounded-xl border border-[#e4caca] bg-[#fff8f8] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d3f3f]">References unavailable</p>
            <p className="mt-2 text-sm leading-6 text-[#6e4b4b]">
              Brand references could not be loaded. Confirm the reference ownership migration is applied, then try again.
            </p>
          </div>
        ) : references.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed bg-[var(--surface)] px-6 py-10 text-center">
            <ShieldCheck size={22} className="text-[#62625e]" strokeWidth={1.7} />
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#252525]">No references yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Add the first approved source for this campaign so future checks can cite genuine reference content.
            </p>
          </div>
        ) : (
          <BrandReferenceList campaignId={campaign.id} references={references} />
        )}
      </section>

      <section className="space-y-5" aria-labelledby="campaign-assets-heading">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
              <FileText size={15} />
              Campaign content
            </div>
            <h2 id="campaign-assets-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#252525]">
              Content assets
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Store the text assets that belong to this campaign. Review and AI analysis are separate later phases.
            </p>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/assets/new`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
          >
            <Plus size={16} className="mr-2" />
            Add asset
          </Link>
        </div>

        {assetsError ? (
          <div className="rounded-xl border border-[#e4caca] bg-[#fff8f8] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d3f3f]">Assets unavailable</p>
            <p className="mt-2 text-sm leading-6 text-[#6e4b4b]">
              Campaign assets could not be loaded. Confirm the asset ownership migration is applied, then try again.
            </p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed bg-[var(--surface)] px-6 py-10 text-center">
            <FileText size={22} className="text-[#62625e]" strokeWidth={1.7} />
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#252525]">No content assets yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Add pasted campaign text or import a `.txt` file to begin building this campaign’s content set.
            </p>
          </div>
        ) : (
          <AssetList campaignId={campaign.id} assets={assets} />
        )}
      </section>
    </div>
  );
}
