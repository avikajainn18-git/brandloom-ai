import assert from "node:assert/strict";
import { test } from "node:test";
import { runDeterministicReview } from "../review-engine.ts";
import {
  mapReviewRecordsToInput,
  persistReviewResult,
  type FindingPersistenceInput,
  type FindingReferencePersistenceInput,
  type ReviewPersistencePort,
  type ReviewRunCompletionInput,
  type ReviewRunFailureInput,
  type ReviewRunPersistenceInput,
} from "../review-persistence.ts";
import type { ReviewResult } from "../review-types.ts";

const campaignId = "campaign-1";

class FakeReviewPersistence implements ReviewPersistencePort {
  readonly runs: ReviewRunPersistenceInput[] = [];
  readonly findings: FindingPersistenceInput[] = [];
  readonly references: FindingReferencePersistenceInput[] = [];
  readonly completions: ReviewRunCompletionInput[] = [];
  readonly failures: ReviewRunFailureInput[] = [];
  failFindingInsert = false;

  async insertReviewRun(input: ReviewRunPersistenceInput) {
    this.runs.push(input);
  }

  async insertFinding(input: FindingPersistenceInput) {
    if (this.failFindingInsert) throw new Error("simulated finding write failure");
    this.findings.push(input);
  }

  async insertFindingReference(input: FindingReferencePersistenceInput) {
    this.references.push(input);
  }

  async completeReviewRun(input: ReviewRunCompletionInput) {
    this.completions.push(input);
  }

  async failReviewRun(input: ReviewRunFailureInput) {
    this.failures.push(input);
  }
}

function mismatchResult(): ReviewResult {
  return runDeterministicReview({
    campaignId,
    assets: [
      {
        id: "asset-25",
        campaignId,
        title: "Social post",
        textContent: "Get 25% off today.",
      },
    ],
    references: [
      {
        id: "ref-20",
        campaignId,
        title: "Approved offer",
        content: "The offer is 20% off.",
        approvalStatus: "approved",
        precedence: 10,
      },
    ],
  });
}

test("maps only campaign-scoped approved database records into review input", () => {
  const input = mapReviewRecordsToInput(
    campaignId,
    [
      { id: "asset-1", campaign_id: campaignId, title: "Email", text_content: "20% off" },
      { id: "asset-other", campaign_id: "campaign-2", title: "Other", text_content: "25% off" },
    ],
    [
      {
        id: "ref-approved",
        campaign_id: campaignId,
        title: "Approved",
        content: "20% off",
        approval_status: "approved",
        precedence: 5,
      },
      {
        id: "ref-pending",
        campaign_id: campaignId,
        title: "Pending",
        content: "25% off",
        approval_status: "pending",
        precedence: 100,
      },
    ],
  );

  assert.deepEqual(input.assets.map((asset) => asset.id), ["asset-1"]);
  assert.deepEqual(input.references.map((reference) => reference.id), ["ref-approved"]);
});

test("persists a mismatch, correction, and genuine evidence relationship", async () => {
  const port = new FakeReviewPersistence();
  const summary = await persistReviewResult(port, campaignId, mismatchResult(), {
    assetIds: new Set(["asset-25"]),
    referenceIds: new Set(["ref-20"]),
    now: () => "2026-10-27T00:00:00.000Z",
    idFactory: (() => {
      const ids = ["run-1", "finding-1"];
      return () => ids.shift() ?? "unexpected-id";
    })(),
  });

  assert.equal(summary.reviewRunId, "run-1");
  assert.equal(summary.status, "findings");
  assert.equal(summary.findingCount, 1);
  assert.equal(port.runs[0]?.status, "running");
  assert.equal(port.completions[0]?.status, "completed");
  assert.equal(port.findings[0]?.affectedAssetId, "asset-25");
  assert.deepEqual(JSON.parse(port.findings[0]?.suggestedCorrection ?? "{}"), {
    kind: "replace_discount_expression",
    from: { percentage: 25, expression: "25% off" },
    to: { percentage: 20, expression: "20% off" },
    replacementText: "20% off",
    rationale: "Replace the detected discount expression with the value in the governing approved reference.",
  });
  assert.deepEqual(JSON.parse(port.references[0]?.evidenceNote ?? "{}"), {
    status: "verified",
    excerpt: "20% off",
    start: 13,
    end: 20,
    expectedValue: { percentage: 20, expression: "20% off" },
    detectedValue: { percentage: 25, expression: "25% off" },
  });
});

test("persists source conflicts as human-review-required findings without correction", async () => {
  const port = new FakeReviewPersistence();
  const result = runDeterministicReview({
    campaignId,
    assets: [{ id: "asset-20", campaignId, title: "Post", textContent: "20% off" }],
    references: [
      {
        id: "ref-20",
        campaignId,
        title: "Brief",
        content: "20% off",
        approvalStatus: "approved",
        precedence: null,
      },
      {
        id: "ref-25",
        campaignId,
        title: "Offer",
        content: "25% off",
        approvalStatus: "approved",
        precedence: null,
      },
    ],
  });

  const summary = await persistReviewResult(port, campaignId, result, {
    assetIds: new Set(["asset-20"]),
    referenceIds: new Set(["ref-20", "ref-25"]),
    idFactory: (() => {
      const ids = ["run-conflict", "finding-conflict"];
      return () => ids.shift() ?? "unexpected-id";
    })(),
  });

  assert.equal(summary.status, "human_review_required");
  assert.equal(summary.conflictCount, 1);
  assert.equal(port.findings[0]?.status, "conflict_requires_review");
  assert.equal(port.findings[0]?.suggestedCorrection, null);
  assert.deepEqual(
    port.references.map((reference) => reference.referenceId),
    ["ref-20", "ref-25"],
  );
});

test("marks the review run failed when a finding write fails", async () => {
  const port = new FakeReviewPersistence();
  port.failFindingInsert = true;

  await assert.rejects(
    persistReviewResult(port, campaignId, mismatchResult(), {
      assetIds: new Set(["asset-25"]),
      referenceIds: new Set(["ref-20"]),
      idFactory: (() => {
        const ids = ["run-failed", "finding-failed"];
        return () => ids.shift() ?? "unexpected-id";
      })(),
    }),
    /simulated finding write failure/,
  );

  assert.equal(port.completions.length, 0);
  assert.equal(port.failures[0]?.id, "run-failed");
  assert.equal(port.failures[0]?.status, "failed");
});

test("rejects evidence that does not correspond to loaded review references", async () => {
  const port = new FakeReviewPersistence();
  const result = mismatchResult();
  const finding = result.findings[0];
  assert.ok(finding);

  await assert.rejects(
    persistReviewResult(
      port,
      campaignId,
      {
        ...result,
        findings: [
          {
            ...finding,
            supportingReferences: finding.supportingReferences.map((reference) => ({
              ...reference,
              referenceId: "not-loaded",
            })),
          },
        ],
      },
      {
        assetIds: new Set(["asset-25"]),
        referenceIds: new Set(["ref-20"]),
      },
    ),
    /unsupported reference evidence/,
  );
  assert.equal(port.runs.length, 0);
});
