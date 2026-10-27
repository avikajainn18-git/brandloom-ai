import Link from "next/link";
import { AlertTriangle, BookOpen, FileText, Scale } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  listConflictFindingsForQueue,
  type QueueConflictFinding,
  type QueueEvidenceItem,
} from "@/lib/data-access/reviews";

export const metadata: Metadata = {
  title: "Review Queue",
};

type ParsedEvidence = {
  status?: string;
  excerpt?: string;
  expectedValue?: { percentage: number; expression: string } | null;
  detectedValue?: { percentage: number; expression: string } | null;
};

function tryParseEvidence(raw: string | null): ParsedEvidence | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedEvidence;
  } catch {
    return null;
  }
}

const severityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const severityClasses: Record<string, string> = {
  low: "text-[#777771]",
  medium: "text-[#7a6b44]",
  high: "text-[#8d3f3f]",
  critical: "text-[#8d3f3f] font-semibold",
};

function EvidenceCard({ item }: { item: QueueEvidenceItem }) {
  const evidence = tryParseEvidence(item.evidence_note);

  return (
    <div className="rounded-lg border bg-[var(--surface)] px-4 py-3">
      <p className="text-sm font-medium text-[#3c3c3a]">
        {item.reference_title}
      </p>
      {evidence?.excerpt ? (
        <p className="mt-1 text-sm text-[var(--muted)]">
          Excerpt:{" "}
          <span className="font-medium text-[#3c3c3a]">
            &ldquo;{evidence.excerpt}&rdquo;
          </span>
        </p>
      ) : null}
      {evidence?.expectedValue || evidence?.detectedValue ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {evidence?.expectedValue ? (
            <>
              Expected:{" "}
              <span className="font-medium text-[#3c3c3a]">
                {evidence.expectedValue.expression}
              </span>
            </>
          ) : null}
          {evidence?.expectedValue && evidence?.detectedValue ? " · " : null}
          {evidence?.detectedValue ? (
            <>
              Detected:{" "}
              <span className="font-medium text-[#3c3c3a]">
                {evidence.detectedValue.expression}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function ConflictCard({ finding }: { finding: QueueConflictFinding }) {
  return (
    <article className="rounded-xl border bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-[var(--surface-subtle)] text-[#62625e]">
            <FileText size={16} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold tracking-[-0.02em] text-[#252525]">
              {finding.asset_title}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {finding.category.replaceAll("_", " ")}
              {finding.severity ? (
                <>
                  {" · "}
                  <span
                    className={
                      severityClasses[finding.severity] ?? "text-[#777771]"
                    }
                  >
                    {severityLabels[finding.severity] ?? finding.severity}{" "}
                    severity
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#e4caca] bg-[#fff8f8] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8d3f3f]">
          <AlertTriangle size={13} />
          Conflict &mdash; review required
        </span>
      </div>

      {/* Campaign context */}
      <div className="mt-3 flex items-center gap-2">
        <BookOpen size={14} className="shrink-0 text-[#8b8b85]" />
        <Link
          href={`/campaigns/${finding.campaign_id}`}
          className="text-xs font-medium text-[#62625e] underline underline-offset-4 transition-colors hover:text-[#252525]"
        >
          {finding.campaign_name}
        </Link>
      </div>

      {/* Explanation */}
      <p className="mt-4 text-sm leading-6 text-[#3c3c3a]">
        {finding.explanation}
      </p>

      {/* Human review notice */}
      <div className="mt-4 rounded-lg border border-[#e0d8c8] bg-[#fdfbf5] px-4 py-3">
        <p className="text-xs font-medium text-[#7a6b44]">
          This conflict requires a human decision. The system cannot
          automatically determine the correct value because approved references
          disagree without resolvable precedence.
        </p>
      </div>

      {/* Supporting references / evidence */}
      {finding.evidence.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b8b85]">
            Conflicting references
          </p>
          {finding.evidence.map((item, index) => (
            <EvidenceCard key={index} item={item} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function ReviewQueuePage() {
  let findings: QueueConflictFinding[] | null = null;
  let loadError = false;

  try {
    findings = await listConflictFindingsForQueue();
  } catch {
    loadError = true;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Human review"
        title="Review Queue"
        description="Approved-source conflicts that the deterministic review engine cannot safely resolve appear here for human judgment."
      />

      {loadError ? (
        <div className="rounded-xl border border-[#e4caca] bg-[#fff8f8] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d3f3f]">
            Review queue unavailable
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6e4b4b]">
            Conflict data could not be loaded. Confirm the review ownership
            migration is applied and you are signed in, then refresh this page.
          </p>
        </div>
      ) : findings !== null && findings.length === 0 ? (
        <EmptyState
          icon={Scale}
          eyebrow="No conflicts pending"
          title="Your review queue is clear"
          description="When a review detects approved-source conflicts that cannot be resolved automatically, they will appear here for human judgment."
        />
      ) : findings !== null ? (
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
            {findings.length}{" "}
            {findings.length === 1
              ? "conflict requires review"
              : "conflicts require review"}
          </p>
          {findings.map((finding) => (
            <ConflictCard key={finding.id} finding={finding} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
