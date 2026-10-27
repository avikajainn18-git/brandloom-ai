import { test } from "node:test";
import assert from "node:assert/strict";
import { runDeterministicReview } from "../review-engine.ts";
import {
  transitionFindingStatus,
  transitionReviewRunStatus,
  InvalidStatusTransitionError,
  type ReviewAsset,
  type ReviewInput,
  type ReviewReference,
} from "../review-types.ts";

const campaignId = "campaign-1";

function reference(
  id: string,
  content: string,
  options: Partial<Pick<ReviewReference, "approvalStatus" | "precedence">> = {},
): ReviewReference {
  return {
    id,
    campaignId,
    title: id,
    content,
    approvalStatus: options.approvalStatus ?? "approved",
    precedence: options.precedence ?? null,
  };
}

function asset(id: string, textContent: string): ReviewAsset {
  return { id, campaignId, title: id, textContent };
}

function input(
  references: readonly ReviewReference[],
  assets: readonly ReviewAsset[],
): ReviewInput {
  return { campaignId, references, assets };
}

test("finds a 20%-versus-25% mismatch with a supported correction", () => {
  const result = runDeterministicReview(
    input([reference("ref-20", "The launch offer is 20% off.")], [asset("asset-25", "Get 25% off today.")]),
  );

  assert.equal(result.status, "findings");
  assert.equal(result.findings.length, 1);
  const [finding] = result.findings;
  assert.equal(finding.status, "verified_mismatch");
  assert.equal(finding.affectedAssetId, "asset-25");
  assert.equal(finding.expectedValue?.percentage, 20);
  assert.equal(finding.detectedValue?.percentage, 25);
  assert.equal(finding.suggestedCorrection?.replacementText, "20% off");
  assert.deepEqual(
    finding.supportingReferences.map((evidence) => evidence.referenceId),
    ["ref-20"],
  );
});

test("does not report a mismatch when approved and asset values agree", () => {
  const result = runDeterministicReview(
    input([reference("ref-20", "The launch offer is 20 percent off.")], [asset("asset-20", "Get 20 percent off today.")]),
  );

  assert.equal(result.status, "no_findings");
  assert.deepEqual(result.findings, []);
});

test("ignores an unapproved reference", () => {
  const result = runDeterministicReview(
    input(
      [reference("ref-pending", "The offer is 20% off.", { approvalStatus: "pending" })],
      [asset("asset-25", "Get 25% off today.")],
    ),
  );

  assert.equal(result.status, "no_findings");
  assert.deepEqual(result.findings, []);
});

test("requires human review for conflicting approved sources with equal precedence", () => {
  const result = runDeterministicReview(
    input(
      [
        reference("ref-20", "The offer is 20% off.", { precedence: 10 }),
        reference("ref-25", "The offer is 25% off.", { precedence: 10 }),
      ],
      [asset("asset-20", "Get 20% off today.")],
    ),
  );

  assert.equal(result.status, "human_review_required");
  assert.equal(result.findings[0]?.status, "conflict_requires_review");
  assert.equal(result.findings[0]?.suggestedCorrection, null);
  assert.deepEqual(
    result.findings[0]?.supportingReferences.map((evidence) => evidence.referenceId),
    ["ref-20", "ref-25"],
  );
});

test("requires human review for conflicting approved sources with missing precedence", () => {
  const result = runDeterministicReview(
    input(
      [reference("ref-20", "The offer is 20% off."), reference("ref-25", "The offer is 25% off.")],
      [asset("asset-20", "Get 20% off today.")],
    ),
  );

  assert.equal(result.status, "human_review_required");
  assert.equal(result.findings[0]?.status, "conflict_requires_review");
  assert.equal(result.findings[0]?.expectedValue, null);
});

test("uses the uniquely higher explicit precedence source", () => {
  const result = runDeterministicReview(
    input(
      [
        reference("ref-low", "The offer is 20% off.", { precedence: 10 }),
        reference("ref-high", "The offer is 25% off.", { precedence: 20 }),
      ],
      [asset("asset-20", "Get 20% off today.")],
    ),
  );

  assert.equal(result.status, "findings");
  assert.equal(result.findings[0]?.expectedValue?.percentage, 25);
  assert.deepEqual(
    result.findings[0]?.supportingReferences.map((evidence) => evidence.referenceId),
    ["ref-high"],
  );
});

test("does not invent a finding when no discount can be extracted", () => {
  const result = runDeterministicReview(
    input([reference("ref-20", "The offer is 20% off.")], [asset("asset-none", "Save 20 dollars this week.")]),
  );

  assert.equal(result.status, "no_findings");
  assert.deepEqual(result.findings, []);
});

test("does not classify unrelated percentages as discount violations", () => {
  const result = runDeterministicReview(
    input([reference("ref-20", "The offer is 20% off.")], [asset("asset-growth", "User growth increased by 25% year over year.")]),
  );

  assert.equal(result.status, "no_findings");
});

test("does not suggest a correction for multiple relevant asset values", () => {
  const result = runDeterministicReview(
    input([reference("ref-20", "The offer is 20% off.")], [asset("asset-ambiguous", "Choose 20% off or 25% off today.")]),
  );

  assert.equal(result.status, "findings");
  assert.equal(result.findings[0]?.status, "uncertain");
  assert.equal(result.findings[0]?.suggestedCorrection, null);
});

test("findings cite only identifiers supplied by the review input", () => {
  const suppliedReferences = [reference("ref-20", "The offer is 20% off.")];
  const result = runDeterministicReview(
    input(suppliedReferences, [asset("asset-25", "Get 25% off today.")]),
  );
  const suppliedIds = new Set(suppliedReferences.map((source) => source.id));

  for (const finding of result.findings) {
    for (const evidence of finding.supportingReferences) {
      assert.equal(suppliedIds.has(evidence.referenceId), true);
      assert.equal(evidence.evidence.sourceId, evidence.referenceId);
    }
  }
});

test("rejects invalid review-run and finding status transitions", () => {
  assert.equal(transitionReviewRunStatus("queued", "running"), "running");
  assert.equal(transitionFindingStatus("verified_mismatch", "resolved"), "resolved");
  assert.throws(
    () => transitionReviewRunStatus("completed", "running"),
    InvalidStatusTransitionError,
  );
  assert.throws(
    () => transitionFindingStatus("dismissed", "resolved"),
    InvalidStatusTransitionError,
  );
});
