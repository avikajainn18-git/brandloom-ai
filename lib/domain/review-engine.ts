import {
  parseDiscountExpressions,
  referenceEvidence,
  replacementFor,
  toDiscountValue,
  withSourceId,
  type DiscountExpression,
} from "./discount-rule.ts";
import type {
  DiscountValue,
  EvidenceExcerpt,
  Finding,
  ReviewInput,
  ReviewReference,
  ReviewResult,
  SupportingReference,
} from "./review-types.ts";

type ReferenceAssessment = {
  reference: ReviewReference;
  expressions: readonly DiscountExpression[];
};

type GoverningSource =
  | {
      kind: "governing";
      assessments: readonly ReferenceAssessment[];
    }
  | {
      kind: "conflict";
      assessments: readonly ReferenceAssessment[];
    }
  | {
      kind: "uncertain";
      assessments: readonly ReferenceAssessment[];
    }
  | { kind: "none" };

function uniqueNumbers(values: readonly number[]): number[] {
  return [...new Set(values)];
}

function approvedAssessments(
  input: ReviewInput,
): { assessments: ReferenceAssessment[]; ambiguous: ReferenceAssessment[] } {
  const assessments: ReferenceAssessment[] = [];
  const ambiguous: ReferenceAssessment[] = [];

  for (const reference of input.references) {
    if (
      reference.campaignId !== input.campaignId ||
      reference.approvalStatus !== "approved"
    ) {
      continue;
    }

    const expressions = parseDiscountExpressions(reference.content);
    const assessment = { reference, expressions };
    if (expressions.length === 1) {
      assessments.push(assessment);
    } else if (expressions.length > 1) {
      ambiguous.push(assessment);
    }
  }

  return { assessments, ambiguous };
}

function selectGoverningSource(
  assessments: readonly ReferenceAssessment[],
  ambiguous: readonly ReferenceAssessment[],
): GoverningSource {
  if (ambiguous.length > 0) {
    return { kind: "uncertain", assessments: [...ambiguous, ...assessments] };
  }
  if (assessments.length === 0) {
    return { kind: "none" };
  }

  const values = uniqueNumbers(
    assessments.map((assessment) => assessment.expressions[0].percentage),
  );
  if (values.length === 1) {
    return { kind: "governing", assessments };
  }

  // A missing precedence value is deliberately not treated as lower or higher
  // precedence. It cannot resolve a disagreement by inference.
  if (assessments.some((assessment) => assessment.reference.precedence === null)) {
    return { kind: "conflict", assessments };
  }

  const highestPrecedence = Math.max(
    ...assessments.map((assessment) => assessment.reference.precedence as number),
  );
  const highest = assessments.filter(
    (assessment) => assessment.reference.precedence === highestPrecedence,
  );
  const highestValues = uniqueNumbers(
    highest.map((assessment) => assessment.expressions[0].percentage),
  );

  if (highestValues.length !== 1) {
    return { kind: "conflict", assessments };
  }

  return { kind: "governing", assessments: highest };
}

function assetEvidence(assetId: string, expression: DiscountExpression): EvidenceExcerpt {
  return withSourceId(expression, assetId);
}

function referenceEvidenceFor(
  source: GoverningSource & { kind: "governing" | "conflict" | "uncertain" },
  status: SupportingReference["status"],
): SupportingReference[] {
  return source.assessments.flatMap((assessment) => {
    return assessment.expressions.map((expression) =>
      referenceEvidence(assessment.reference, expression, status),
    );
  });
}

function valueFromExpression(expression: DiscountExpression | undefined): DiscountValue | null {
  return expression ? toDiscountValue(expression) : null;
}

function ambiguousAssetFinding(
  assetId: string,
  expressions: readonly DiscountExpression[],
  source: GoverningSource,
): Finding {
  const first = expressions[0];
  const isSourceConflict = source.kind === "conflict";
  const evidence =
    source.kind === "none"
      ? []
      : referenceEvidenceFor(source, isSourceConflict ? "conflict_requires_review" : "uncertain");

  return {
    category: "discount_mismatch",
    status: isSourceConflict ? "conflict_requires_review" : "uncertain",
    severity: isSourceConflict ? "high" : "medium",
    affectedAssetId: assetId,
    explanation: isSourceConflict
      ? "The asset contains multiple discount expressions and approved references also conflict without resolvable precedence. Human review is required before suggesting a correction."
      : "The asset contains multiple discount expressions, so the engine cannot determine which value should be compared or corrected.",
    expectedValue: null,
    detectedValue: valueFromExpression(first),
    assetEvidence: first ? assetEvidence(assetId, first) : null,
    supportingReferences: evidence,
    suggestedCorrection: null,
  };
}

function conflictFinding(
  assetId: string,
  detected: DiscountExpression,
  source: Extract<GoverningSource, { kind: "conflict" }>,
): Finding {
  return {
    category: "discount_mismatch",
    status: "conflict_requires_review",
    severity: "high",
    affectedAssetId: assetId,
    explanation:
      "Approved references specify different discount values and their explicit precedence does not resolve the conflict. Human review is required before suggesting a correction.",
    expectedValue: null,
    detectedValue: toDiscountValue(detected),
    assetEvidence: assetEvidence(assetId, detected),
    supportingReferences: referenceEvidenceFor(source, "conflict_requires_review"),
    suggestedCorrection: null,
  };
}

function uncertainSourceFinding(
  assetId: string,
  detected: DiscountExpression,
  source: Extract<GoverningSource, { kind: "uncertain" }>,
): Finding {
  return {
    category: "discount_mismatch",
    status: "uncertain",
    severity: "medium",
    affectedAssetId: assetId,
    explanation:
      "An approved reference contains multiple discount expressions, so the expected value is ambiguous and no correction is supported.",
    expectedValue: null,
    detectedValue: toDiscountValue(detected),
    assetEvidence: assetEvidence(assetId, detected),
    supportingReferences: referenceEvidenceFor(source, "uncertain"),
    suggestedCorrection: null,
  };
}

function mismatchFinding(
  assetId: string,
  detected: DiscountExpression,
  source: Extract<GoverningSource, { kind: "governing" }>,
): Finding | null {
  const expected = source.assessments[0]?.expressions[0];
  if (!expected || expected.percentage === detected.percentage) {
    return null;
  }

  const expectedValue = toDiscountValue(expected);
  return {
    category: "discount_mismatch",
    status: "verified_mismatch",
    severity: "medium",
    affectedAssetId: assetId,
    explanation: `The asset states ${detected.percentage}% off, while the governing approved reference states ${expected.percentage}% off.`,
    expectedValue,
    detectedValue: toDiscountValue(detected),
    assetEvidence: assetEvidence(assetId, detected),
    supportingReferences: referenceEvidenceFor(source, "verified"),
    suggestedCorrection: {
      kind: "replace_discount_expression",
      from: toDiscountValue(detected),
      to: expectedValue,
      replacementText: replacementFor(detected, expected),
      rationale: "Replace the detected discount expression with the value in the governing approved reference.",
    },
  };
}

export function runDeterministicReview(input: ReviewInput): ReviewResult {
  const { assessments, ambiguous } = approvedAssessments(input);
  const source = selectGoverningSource(assessments, ambiguous);
  const findings: Finding[] = [];

  for (const asset of input.assets) {
    if (asset.campaignId !== input.campaignId) {
      continue;
    }

    const expressions = parseDiscountExpressions(asset.textContent);
    if (expressions.length === 0 || source.kind === "none") {
      continue;
    }

    if (expressions.length > 1) {
      findings.push(ambiguousAssetFinding(asset.id, expressions, source));
      continue;
    }

    const detected = withSourceId(expressions[0], asset.id);
    if (source.kind === "conflict") {
      findings.push(conflictFinding(asset.id, detected, source));
    } else if (source.kind === "uncertain") {
      findings.push(uncertainSourceFinding(asset.id, detected, source));
    } else {
      const finding = mismatchFinding(asset.id, detected, source);
      if (finding) findings.push(finding);
    }
  }

  const hasConflict = findings.some(
    (finding) => finding.status === "conflict_requires_review",
  );
  const hasFindings = findings.length > 0;

  return {
    status: hasConflict
      ? "human_review_required"
      : hasFindings
        ? "findings"
        : "no_findings",
    findings,
    examinedAssetIds: input.assets
      .filter((asset) => asset.campaignId === input.campaignId)
      .map((asset) => asset.id),
    examinedReferenceIds: input.references
      .filter((reference) => reference.campaignId === input.campaignId)
      .map((reference) => reference.id),
  };
}
