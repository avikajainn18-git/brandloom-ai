import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { AssetRow } from "@/lib/data-access/assets";

const typeLabels: Record<AssetRow["asset_type"], string> = {
  email: "Email",
  advertisement: "Advertisement",
  social_post: "Social post",
  landing_page: "Landing page",
  other: "Other",
};

export function AssetList({
  campaignId,
  assets,
}: {
  campaignId: string;
  assets: AssetRow[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {assets.map((asset) => (
        <Link
          key={asset.id}
          href={`/campaigns/${campaignId}/assets/${asset.id}`}
          className="group rounded-xl border bg-white p-5 transition-colors hover:border-[#bdbdb7] hover:bg-[#fdfdfc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-[var(--surface-subtle)] text-[#62625e]">
                <FileText size={16} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-semibold tracking-[-0.02em] text-[#252525] group-hover:underline group-hover:underline-offset-4">
                  {asset.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{typeLabels[asset.asset_type]}</p>
              </div>
            </div>
            <ArrowRight size={17} className="mt-1 shrink-0 text-[#8b8b85] transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{asset.text_content}</p>
          <div className="mt-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
            <span>Revision {asset.current_revision}</span>
            <span aria-hidden="true">·</span>
            <span>Updated {new Date(asset.updated_at).toLocaleDateString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
