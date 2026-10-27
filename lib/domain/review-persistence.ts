import type {
  Finding,
  FindingSeverity,
  FindingStatus,
  ReviewAsset,
  ReviewOverallStatus,
  ReviewReference,
  ReviewResult,
} from "./review-types.ts";

export type ReviewAssetRecord = {
  id: string;
  campaign_id: string;
  title: string;
  text_content: string;
};

export type ReviewReferenceRecord = {
  id: string;
  campaign_id: string;
  title: string;
  content: string;
  approval_status: ReviewReference["approvalStatus"];
  precedence: number | null;
};

export type ReviewRunPersistenceInput = {
  id: string;
  campaignId: string;
  status: "running";
  startedAt: string;
};

export type ReviewRunCompletionInput = {
  id: string;
  status: "completed";
  findingCount: number;
  conflictCount: number;
  completedAt: string;
};

export type ReviewRunFailureInput = {
  id: string;
  status: "failed";
  errorMessage: string;
  completedAt: string;
};

export type FindingPersistenceInput = {
  id: string;
  reviewRunId: string;
  affectedAssetId: string;
  category: string;
  explanation: string;
  status: FindingStatus;
  severity: FindingSeverity;
  suggestedCorrection: string | null;
};

export type FindingReferencePersistenceInput = {
  findingId: string;
  referenceId: string;
  evidenceNote: string;
};

export type ReviewPersistencePort = {
  insertReviewRun(input: ReviewRunPersistenceInput): Promise<void>;
  insertFinding(input: FindingPersistenceInput): Promise<void>;
  insertFindingReference(input: FindingReferencePersistenceInput): Promise<void>;
  completeReviewRun(input: ReviewRunCompletionInput): Promise<void>;
  failReviewRun(input: ReviewRunFailureInput): Promise<void>;
};

export type PersistedFindingSummary = Finding & {
  id: string;
};

export type PersistedReviewSummary = {
  reviewRunId: string;
  campaignId: string;
  reviewRunStatus: "completed";
  status: ReviewOverallStatus;
  findingCount: number;
  conflictCount: number;
  findings: readonly PersistedFindingSummary[];
};

export function mapReviewRecordsToInput(
  campaignId: string,
  assets: readonly ReviewAssetRecord[],
  references: readonly ReviewReferenceRecord[],
): {
  campaignId: string;
  assets: readonly ReviewAsset[];
  references: readonly ReviewReference[];
} {
  return {
    campaignId,
    assets: assets
      .filter((asset) => asset.campaign_id === campaignId)
      .map((asset) => ({
        id: asset.id,
        campaignId: asset.campaign_id,
        title: asset.title,
        textContent: asset.text_content,
      })),
    references: references
      .filter(
        (reference) =>
          reference.campaign_id === campaignId &&
          reference.approval_status === "approved",
      )
      .map((reference) => ({
        id: reference.id,
        campaignId: reference.campaign_id,
        title: reference.title,
        content: reference.content,
        approvalStatus: reference.approval_status,
        precedence: reference.precedence,
      })),
  };
}

function serializeEvidence(finding: Finding): readonly FindingReferencePersistenceInput[] {
  return finding.supportingReferences.map((supportingReference) => ({
    findingId: "",
    referenceId: supportingReference.referenceId,
    evidenceNote: JSON.stringify({
      status: supportingReference.status,
      excerpt: supportingReference.evidence.excerpt,
      start: supportingReference.evidence.start,
      end: supportingReference.evidence.end,
      expectedValue: finding.expectedValue,
      detectedValue: finding.detectedValue,
    }),
  }));
}

export function serializeCorrection(finding: Finding): string | null {
  return finding.suggestedCorrection
    ? JSON.stringify(finding.suggestedCorrection)
    : null;
}

export function buildFindingPersistenceInput(
  reviewRunId: string,
  finding: Finding,
  id: string,
): FindingPersistenceInput {
  return {
    id,
    reviewRunId,
    affectedAssetId: finding.affectedAssetId,
    category: finding.category,
    explanation: finding.explanation,
    status: finding.status,
    severity: finding.severity,
    suggestedCorrection: serializeCorrection(finding),
  };
}

export function buildFindingReferencePersistenceInputs(
  findingId: string,
  finding: Finding,
): readonly FindingReferencePersistenceInput[] {
  return serializeEvidence(finding).map((reference) => ({
    ...reference,
    findingId,
  }));
}

function validateReviewResultReferences(
  result: ReviewResult,
  assetIds: ReadonlySet<string>,
  referenceIds: ReadonlySet<string>,
): void {
  for (const finding of result.findings) {
    if (!assetIds.has(finding.affectedAssetId)) {
      throw new Error("Review result contains an unknown affected asset.");
    }

    for (const supportingReference of finding.supportingReferences) {
      if (
        !referenceIds.has(supportingReference.referenceId) ||
        supportingReference.evidence.sourceId !== supportingReference.referenceId
      ) {
        throw new Error("Review result contains unsupported reference evidence.");
      }
    }
  }
}

export async function persistReviewResult(
  port: ReviewPersistencePort,
  campaignId: string,
  result: ReviewResult,
  options: {
    assetIds: ReadonlySet<string>;
    referenceIds: ReadonlySet<string>;
    now?: () => string;
    idFactory?: () => string;
  },
): Promise<PersistedReviewSummary> {
  validateReviewResultReferences(result, options.assetIds, options.referenceIds);

  const now = options.now ?? (() => new Date().toISOString());
  const idFactory = options.idFactory ?? (() => crypto.randomUUID());
  const reviewRunId = idFactory();
  const startedAt = now();

  await port.insertReviewRun({
    id: reviewRunId,
    campaignId,
    status: "running",
    startedAt,
  });

  try {
    const persistedFindings: PersistedFindingSummary[] = [];

    for (const finding of result.findings) {
      const findingId = idFactory();
      await port.insertFinding(buildFindingPersistenceInput(reviewRunId, finding, findingId));

      for (const evidence of buildFindingReferencePersistenceInputs(findingId, finding)) {
        await port.insertFindingReference(evidence);
      }

      persistedFindings.push({ id: findingId, ...finding });
    }

    const conflictCount = result.findings.filter(
      (finding) => finding.status === "conflict_requires_review",
    ).length;

    await port.completeReviewRun({
      id: reviewRunId,
      status: "completed",
      findingCount: result.findings.length,
      conflictCount,
      completedAt: now(),
    });

    return {
      reviewRunId,
      campaignId,
      reviewRunStatus: "completed",
      status: result.status,
      findingCount: result.findings.length,
      conflictCount,
      findings: persistedFindings,
    };
  } catch (error) {
    try {
      await port.failReviewRun({
        id: reviewRunId,
        status: "failed",
        errorMessage: "Review persistence failed before all results were saved.",
        completedAt: now(),
      });
    } catch {
      // Preserve the original failure. The run remains non-completed if the
      // failure update itself cannot be written.
    }
    throw error;
  }
}
