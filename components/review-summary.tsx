"use client";

import { useActionState } from "react";
import { PlayCircle, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import type { ReviewActionState } from "@/app/(workspace)/review-actions";
import type { ReviewRunRow } from "@/lib/data-access/reviews";

type ReviewAction = (
  previousState: ReviewActionState,
  formData: FormData,
) => Promise<ReviewActionState>;

const statusConfig: Record<
  ReviewRunRow["status"],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  queued: {
    label: "Queued",
    className: "border-[#d5d5d0] bg-[#fafaf9] text-[#777771]",
    icon: Clock,
  },
  running: {
    label: "Running",
    className: "border-[#c8d4e0] bg-[#f5f8fb] text-[#4a6a8a]",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    className: "border-[#d5ded4] bg-[#f6faf5] text-[#456044]",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "border-[#e4caca] bg-[#fff8f8] text-[#8d3f3f]",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-[#d5d5d0] bg-[#fafaf9] text-[#777771]",
    icon: XCircle,
  },
};

function formatTimestamp(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function ReviewSummary({
  campaignId,
  reviewRun,
  action,
  hasAssets,
  hasReferences,
}: {
  campaignId: string;
  reviewRun: ReviewRunRow | null;
  action: ReviewAction;
  hasAssets: boolean;
  hasReferences: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const config = reviewRun ? statusConfig[reviewRun.status] : null;
  const StatusIcon = config?.icon ?? CheckCircle2;

  const canRun = hasAssets && hasReferences;

  return (
    <div className="space-y-5">
      {/* Run review form */}
      <form action={formAction}>
        <input type="hidden" name="campaignId" value={campaignId} />
        {!canRun ? (
          <div className="rounded-xl border border-dashed bg-[var(--surface)] p-5">
            <p className="text-sm text-[var(--muted)]">
              Add at least one approved reference and one content asset before
              running a review.
            </p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
          >
            <PlayCircle size={16} className="mr-2" />
            {isPending
              ? "Running review…"
              : reviewRun
                ? "Re-run review"
                : "Run review"}
          </button>
        )}
      </form>

      {/* Action result messages */}
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-[#e4caca] bg-[#fff8f8] px-4 py-3 text-sm text-[#8d3f3f]"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-lg border border-[#d5ded4] bg-[#f6faf5] px-4 py-3 text-sm text-[#456044]"
        >
          Review completed successfully.
        </p>
      ) : null}

      {/* Latest review run summary */}
      {reviewRun ? (
        <div className="rounded-xl border bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
                Latest review run
              </p>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                Started {formatTimestamp(reviewRun.started_at)}
                {reviewRun.completed_at
                  ? ` · Completed ${formatTimestamp(reviewRun.completed_at)}`
                  : null}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${config?.className}`}
            >
              <StatusIcon size={13} />
              {config?.label}
            </span>
          </div>

          {reviewRun.status === "completed" ? (
            <div className="mt-5 flex items-center gap-6 border-t pt-5">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.03em] text-[#252525]">
                  {reviewRun.finding_count}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {reviewRun.finding_count === 1 ? "Finding" : "Findings"}
                </p>
              </div>
              {reviewRun.conflict_count > 0 ? (
                <div>
                  <p className="flex items-center gap-1.5 text-2xl font-semibold tracking-[-0.03em] text-[#8d3f3f]">
                    <AlertTriangle size={18} />
                    {reviewRun.conflict_count}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {reviewRun.conflict_count === 1
                      ? "Conflict"
                      : "Conflicts"}
                  </p>
                </div>
              ) : null}
              {reviewRun.finding_count === 0 ? (
                <p className="text-sm text-[#456044]">
                  No findings were generated by the current deterministic checks.
                </p>
              ) : null}
            </div>
          ) : null}

          {reviewRun.status === "failed" && reviewRun.error_message ? (
            <div className="mt-5 rounded-lg border border-[#e4caca] bg-[#fff8f8] px-4 py-3">
              <p className="text-sm text-[#8d3f3f]">
                {reviewRun.error_message}
              </p>
            </div>
          ) : null}

          {reviewRun.status === "completed" ? (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Review completion indicates analysis is finished. It does not
              imply campaign approval.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
