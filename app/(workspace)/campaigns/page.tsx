import Link from "next/link";
import { ArrowRight, BookOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { listOwnedCampaigns } from "@/lib/data-access/campaigns";

export const metadata: Metadata = {
  title: "Campaigns",
};

export default async function CampaignsPage() {
  const campaigns = await listOwnedCampaigns();

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <PageHeader
          eyebrow="Campaign workspace"
          title="Campaigns"
          description="Organize related assets into campaigns so brand consistency can be reviewed at the right level."
        />
        <Link
          href="/campaigns/new"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          <Plus size={16} className="mr-2" />
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          eyebrow="No campaigns"
          title="Create your first campaign"
          description="Campaigns connect related content and approved references. Start with a name and add context when useful."
          action={
            <Link
              href="/campaigns/new"
              className="inline-flex items-center rounded-lg border px-4 py-2.5 text-sm font-medium text-[#3c3c3a] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
            >
              Create campaign
              <ArrowRight size={16} className="ml-2" />
            </Link>
          }
        />
      ) : (
        <section aria-label="Your campaigns" className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="group rounded-xl border bg-white p-5 transition-colors hover:border-[#bdbdb7] hover:bg-[#fdfdfc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold tracking-[-0.02em] text-[#252525] group-hover:underline group-hover:underline-offset-4">
                    {campaign.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {campaign.description || "No description added yet."}
                  </p>
                </div>
                <ArrowRight size={17} className="mt-0.5 shrink-0 text-[#8b8b85] transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8b8b85]">
                <span>{campaign.status.replaceAll("_", " ")}</span>
                <span aria-hidden="true">·</span>
                <span>Updated {new Date(campaign.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
