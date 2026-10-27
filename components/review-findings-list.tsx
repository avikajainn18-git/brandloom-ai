import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  FileText,
  ShieldAlert,
} from "lucide-react";
import type { FindingWithAsset, FindingReferenceWithTitle } from "@/lib/data-access/reviews";
import type { Database } from "@/lib/supabase/database.types";

type FindingStatus = Database["public"]["Enums"]["finding_status"];
type FindingSeverity = Database["public"]["Enums"]["finding_severity"];

const statusConfig: Record<
  FindingStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  verified_mismatch: {
    label: "Verified mismatch",
    className: "border-[#e4caca] bg-[#fff8f8] text-[#8d3f3f]",
    icon: ShieldAlert,
  },
  uncertain: {
    label: "Uncertain",
    className: "border-[#e0d8c8] bg-[#fdfbf5] text-[#7a6b44]",
    icon: CircleHelp,
  },
  conflict_requires_review: {
    label: "Conflict — review required",
    className: "border-[#e4caca] bg-[#fff8f8] text-[#8d3f3f]",
    icon: AlertTriangle,
  },
  resolved: {
    label: "Resolved",
    className: "border-[#d5ded4] bg-[#f6faf5] text-[#456044]",
    icon: CheckCircle2,
  },
  dismissed: {
    label: "Dismissed",
    className: "border-[#d5d5d0] bg-[#fafaf9] text-[#777771]",
    icon: CheckCircle2,
  },
};

const severityLabels: Record<NonNullable<FindingSeverity>, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const severityClasses: Record<NonNullable<FindingSeverity>, string> = {
  low: "text-[#777771]",
  medium: "text-[#7a6b44]",
  high: "text-[#8d3f3f]",
  critical: "text-[#8d3f3f] font-semibold",
};

type ParsedCorrection = {
  kind: string;
  from?: { percentage: number; expression: string };
  to?: { percentage: number; expression: string };
  replacementText?: string;
  rationale?: string;
};

function tryParseCorrection(raw: string | null): ParsedCorrection | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ParsedCorrection;
    if (typeof parsed === "object" && parsed !== null && parsed.kind) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

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

export function ReviewFindingsList({
  findings,
  references,
}: {
  findings: FindingWithAsset[];
  references: FindingReferenceWithTitle[];
}) {
  if (findings.length === 0) {
    return null;
  }

  // Group references by finding ID for lookup
  const referencesByFinding = new Map<string, FindingReferenceWithTitle[]>();
  for (const ref of references) {
    const existing = referencesByFinding.get(ref.finding_id) ?? [];
    existing.push(ref);
    referencesByFinding.set(ref.finding_id, existing);
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
        {findings.length} {findings.length === 1 ? "finding" : "findings"}
      </p>
      {findings.map((finding) => {
        const config = statusConfig[finding.status];
        const StatusIcon = config.icon;
        const findingRefs = referencesByFinding.get(finding.id) ?? [];
        const correction = tryParseCorrection(finding.suggested_correction);

        return (
          <article
            key={finding.id}
            className="rounded-xl border bg-white p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-[var(--surface-subtle)] text-[#62625e]">
                  <FileText size={16} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h4 className="font-semibold tracking-[-0.02em] text-[#252525]">
                    {finding.asset_title}
                  </h4>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {finding.category.replaceAll("_", " ")}
                    {finding.severity ? (
                      <>
                        {" · "}
                        <span className={severityClasses[finding.severity]}>
                          {severityLabels[finding.severity]} severity
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${config.className}`}
              >
                <StatusIcon size={13} />
                {config.label}
              </span>
            </div>

            {/* Explanation */}
            <p className="mt-4 text-sm leading-6 text-[#3c3c3a]">
              {finding.explanation}
            </p>

            {/* Supporting references / evidence */}
            {findingRefs.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b8b85]">
                  Supporting references
                </p>
                {findingRefs.map((ref) => {
                  const evidence = tryParseEvidence(ref.evidence_note);
                  return (
                    <div
                      key={`${ref.finding_id}-${ref.reference_id}`}
                      className="rounded-lg border bg-[var(--surface)] px-4 py-3"
                    >
                      <p className="text-sm font-medium text-[#3c3c3a]">
                        {ref.reference_title}
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
    {evidence?.expectedValue && evidence?.detectedValue
      ? " · "
      : null}
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
                })}
              </div>
            ) : null}

            {/* Suggested correction */}
            {correction ? (
              <div className="mt-4 rounded-lg border border-[#c8d4e0] bg-[#f5f8fb] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a6a8a]">
                  Suggested correction
                </p>
                {correction.from && correction.to ? (
                  <p className="mt-1.5 text-sm text-[#3c3c3a]">
                    Replace{" "}
                    <span className="rounded bg-[#fee] px-1.5 py-0.5 font-mono text-xs text-[#8d3f3f]">
                      {correction.from.expression}
                    </span>{" "}
                    with{" "}
                    <span className="rounded bg-[#efe] px-1.5 py-0.5 font-mono text-xs text-[#456044]">
                      {correction.to.expression}
                    </span>
                  </p>
                ) : null}
                {correction.rationale ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {correction.rationale}
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
