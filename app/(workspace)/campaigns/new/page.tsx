import type { Metadata } from "next";
import { CampaignForm } from "@/components/campaign-form";
import { PageHeader } from "@/components/page-header";
import { createCampaignAction } from "@/app/(workspace)/campaign-actions";

export const metadata: Metadata = {
  title: "New campaign",
};

export default function NewCampaignPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campaign workspace"
        title="New campaign"
        description="Create a campaign to hold related assets and approved brand references."
      />
      <CampaignForm action={createCampaignAction} />
    </div>
  );
}
