import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
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
        description="Manage the approved guidelines, facts, terminology, claims, and offer details that support campaign review."
      />
      <EmptyState
        icon={ShieldCheck}
        eyebrow="No references"
        title="Approved references will live here"
        description="Reference management and approval controls will be introduced with campaign and persistence support."
      />
    </div>
  );
}
