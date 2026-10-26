import { ArrowRight, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace overview"
        title="Welcome to Brandloom AI"
        description="Keep related campaign assets aligned with approved brand references through evidence-backed review and targeted corrections."
      />
      <EmptyState
        icon={LayoutDashboard}
        eyebrow="Empty workspace"
        title="Start with a campaign"
        description="Your workspace is ready. Create a campaign to begin organizing content and approved references."
        action={
          <Button href="/campaigns">
            View campaigns
            <ArrowRight className="ml-2" size={16} />
          </Button>
        }
      />
    </div>
  );
}
