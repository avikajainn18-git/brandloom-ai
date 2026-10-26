import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Brand References",
};

export default function BrandReferencesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Approved information"
        title="Brand References"
        description="Brand references belong to a campaign so their authority and precedence remain traceable."
      />
      <section className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-[var(--surface)] px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border bg-[var(--surface-subtle)] text-[#5f5f5b]">
          <ShieldCheck size={21} strokeWidth={1.7} />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">Campaign-scoped</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#252525]">Choose a campaign to manage references</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
          Open a campaign to view, add, inspect, and edit its stored approved references.
        </p>
        <Link
          href="/campaigns"
          className="mt-6 inline-flex items-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          View campaigns
          <ArrowRight size={16} className="ml-2" />
        </Link>
      </section>
    </div>
  );
}
