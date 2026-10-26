import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campaign-form";
import { PageHeader } from "@/components/page-header";
import { updateCampaignAction } from "@/app/(workspace)/campaign-actions";
import {
  CampaignNotFoundError,
  getOwnedCampaign,
} from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Campaign details",
};

export default async function CampaignDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let campaign;

  try {
    campaign = await getOwnedCampaign(id);
  } catch (error) {
    if (error instanceof CampaignNotFoundError) notFound();
    throw error;
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
        description="Update the campaign identity and context. Related asset and reference management will be added in later phases."
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
    </div>
  );
}
