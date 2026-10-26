import { Scale } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Review Queue",
};

export default function ReviewQueuePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Human review"
        title="Review Queue"
        description="Resolve approved-source conflicts and other cases that need a human decision before content can move forward."
      />
      <EmptyState
        icon={Scale}
        eyebrow="No review tickets"
        title="Your review queue is clear"
        description="Conflict-triggered human-review tickets will appear here when review and ticket processing are implemented."
      />
    </div>
  );
}
