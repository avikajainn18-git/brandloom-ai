import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  BrandReferenceNotFoundError,
  getOwnedBrandReference,
} from "@/lib/data-access/brand-references";
import { getOwnedCampaign, CampaignNotFoundError } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Brand reference",
};

const typeLabels = {
  campaign_brief: "Campaign brief",
  brand_guidelines: "Brand guidelines",
  terminology: "Terminology",
  claim: "Claim",
  fact: "Fact",
  offer: "Offer",
  other: "Other",
} as const;

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  superseded: "Superseded",
} as const;

export default async function BrandReferencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; referenceId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id, referenceId }, query] = await Promise.all([params, searchParams]);
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
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="inline-flex items-center text-sm font-medium text-[#62625e] transition-colors hover:text-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to {campaign.name}
        </Link>
        <span className="rounded-full border bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#777771]">
          {statusLabels[reference.approval_status]}
        </span>
      </div>

      <PageHeader
        eyebrow={typeLabels[reference.reference_type]}
        title={reference.title}
        description="Inspect the stored reference details and update them when the approved source changes."
      />

      {query.saved === "1" ? (
        <p role="status" className="rounded-lg border border-[#d5ded4] bg-[#f6faf5] px-4 py-3 text-sm text-[#456044]">
          Reference changes saved.
        </p>
      ) : null}

      <section className="rounded-xl border bg-white p-6 sm:p-8" aria-labelledby="reference-details-heading">
        <div className="flex items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">Stored reference</p>
            <h2 id="reference-details-heading" className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#252525]">
              Approved source details
            </h2>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/references/${reference.id}/edit`}
            className="inline-flex shrink-0 items-center rounded-lg border px-3.5 py-2 text-sm font-medium text-[#555550] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
          >
            <Pencil size={15} className="mr-2" />
            Edit
          </Link>
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b85]">Authority</dt>
            <dd className="mt-1 text-sm text-[#3c3c3a]">{reference.authority || "Not specified"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b85]">Precedence</dt>
            <dd className="mt-1 text-sm text-[#3c3c3a]">
              {reference.precedence === null ? "Not specified" : reference.precedence}
            </dd>
          </div>
        </dl>
        <div className="mt-7 border-t pt-6">
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b85]">Content</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#3c3c3a]">{reference.content}</p>
        </div>
      </section>
    </div>
  );
}
