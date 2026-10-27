/**
 * The deterministic review domain deliberately uses plain values rather than
 * Supabase rows. Adapters can map these contracts to persistence records later.
 */

export type ReviewRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type FindingStatus =
  | "verified_mismatch"
  | "uncertain"
  | "conflict_requires_review"
  | "resolved"
  | "dismissed";

export type FindingSeverity = "low" | "medium" | "high" | "critical";

export type FindingCategory = "discount_mismatch";

export type EvidenceStatus =
  | "verified"
  | "uncertain"
  | "conflict_requires_review";

export type ReviewOverallStatus =
  | "no_findings"
  | "findings"
  | "human_review_required";

export type DiscountValue = {
  percentage: number;
  expression: string;
};

export type ReviewAsset = {
  id: string;
  campaignId: string;
  title: string;
  textContent: string;
};

export type ReviewReference = {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  approvalStatus: "pending" | "approved" | "rejected" | "superseded";
  /** Explicit human-defined precedence. Null never wins a conflict. */
  precedence: number | null;
};

export type ReviewInput = {
  campaignId: string;
  assets: readonly ReviewAsset[];
  references: readonly ReviewReference[];
};

export type EvidenceExcerpt = {
  sourceId: string;
  excerpt: string;
  start: number;
  end: number;
};

export type SupportingReference = {
  referenceId: string;
  referenceTitle: string;
  evidence: EvidenceExcerpt;
  status: EvidenceStatus;
};

export type CorrectionSuggestion = {
  kind: "replace_discount_expression";
  from: DiscountValue;
  to: DiscountValue;
  replacementText: string;
  rationale: string;
};

export type Finding = {
  category: FindingCategory;
  status: Exclude<FindingStatus, "resolved" | "dismissed">;
  severity: FindingSeverity;
  affectedAssetId: string;
  explanation: string;
  expectedValue: DiscountValue | null;
  detectedValue: DiscountValue | null;
  assetEvidence: EvidenceExcerpt | null;
  supportingReferences: readonly SupportingReference[];
  suggestedCorrection: CorrectionSuggestion | null;
};

export type ReviewResult = {
  status: ReviewOverallStatus;
  findings: readonly Finding[];
  examinedAssetIds: readonly string[];
  examinedReferenceIds: readonly string[];
};

/** Shape corresponding to public.review_runs without coupling the domain to Supabase. */
export type ReviewRunRecord = {
  id: string;
  campaignId: string;
  status: ReviewRunStatus;
  findingCount: number;
  conflictCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Shape corresponding to public.findings without coupling the domain to Supabase. */
export type FindingRecord = {
  id: string;
  reviewRunId: string;
  affectedAssetId: string;
  category: FindingCategory;
  explanation: string;
  status: FindingStatus;
  severity: FindingSeverity | null;
  suggestedCorrection: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Shape corresponding to public.finding_references. */
export type FindingReferenceRecord = {
  findingId: string;
  referenceId: string;
  evidenceNote: string | null;
};

export class InvalidStatusTransitionError extends Error {
  constructor(entity: "review run" | "finding", from: string, to: string) {
    super(`Invalid ${entity} status transition from ${from} to ${to}.`);
    this.name = "InvalidStatusTransitionError";
  }
}

const reviewRunTransitions: Record<ReviewRunStatus, readonly ReviewRunStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

const findingTransitions: Record<FindingStatus, readonly FindingStatus[]> = {
  verified_mismatch: ["resolved", "dismissed"],
  uncertain: ["verified_mismatch", "conflict_requires_review", "resolved", "dismissed"],
  conflict_requires_review: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};

export function canTransitionReviewRunStatus(
  from: ReviewRunStatus,
  to: ReviewRunStatus,
): boolean {
  return reviewRunTransitions[from].includes(to);
}

export function transitionReviewRunStatus(
  from: ReviewRunStatus,
  to: ReviewRunStatus,
): ReviewRunStatus {
  if (!canTransitionReviewRunStatus(from, to)) {
    throw new InvalidStatusTransitionError("review run", from, to);
  }
  return to;
}

export function canTransitionFindingStatus(
  from: FindingStatus,
  to: FindingStatus,
): boolean {
  return findingTransitions[from].includes(to);
}

export function transitionFindingStatus(
  from: FindingStatus,
  to: FindingStatus,
): FindingStatus {
  if (!canTransitionFindingStatus(from, to)) {
    throw new InvalidStatusTransitionError("finding", from, to);
  }
  return to;
}
