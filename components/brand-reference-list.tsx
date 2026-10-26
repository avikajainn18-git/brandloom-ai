import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { BrandReferenceRow } from "@/lib/data-access/brand-references";

const typeLabels: Record<BrandReferenceRow["reference_type"], string> = {
  campaign_brief: "Campaign brief",
  brand_guidelines: "Brand guidelines",
  terminology: "Terminology",
  claim: "Claim",
  fact: "Fact",
  offer: "Offer",
  other: "Other",
};

const statusLabels: Record<BrandReferenceRow["approval_status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  superseded: "Superseded",
};

export function BrandReferenceList({
  campaignId,
  references,
}: {
  campaignId: string;
  references: BrandReferenceRow[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {references.map((reference) => (
        <Link
          key={reference.id}
          href={`/campaigns/${campaignId}/references/${reference.id}`}
          className="group rounded-xl border bg-white p-5 transition-colors hover:border-[#bdbdb7] hover:bg-[#fdfdfc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-[var(--surface-subtle)] text-[#62625e]">
                <FileText size={16} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-semibold tracking-[-0.02em] text-[#252525] group-hover:underline group-hover:underline-offset-4">
                  {reference.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {typeLabels[reference.reference_type]}
                </p>
              </div>
            </div>
            <ArrowRight size={17} className="mt-1 shrink-0 text-[#8b8b85] transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{reference.content}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
            <span>{statusLabels[reference.approval_status]}</span>
            {reference.authority ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{reference.authority}</span>
              </>
            ) : null}
            {reference.precedence !== null ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Priority {reference.precedence}</span>
              </>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
