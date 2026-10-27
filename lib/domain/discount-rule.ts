import type {
  DiscountValue,
  EvidenceExcerpt,
  ReviewReference,
  SupportingReference,
} from "./review-types.ts";

export type DiscountExpression = DiscountValue & EvidenceExcerpt & {
  numberStart: number;
  numberEnd: number;
};

/**
 * Parses only an explicit discount grammar:
 *   <number> [space] (% | percent | percentage) [space] (off | discount)
 *
 * This intentionally excludes bare percentages ("20% growth"), percentages
 * used with unrelated units, and values outside the meaningful 0–100 range.
 */
const discountPattern =
  /(?<![\w.])(\d{1,3}(?:\.\d+)?)\s*(%|percent(?:age)?)\s*(off|discount)\b/gi;

function formatPercentage(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function parseDiscountExpressions(text: string): DiscountExpression[] {
  if (typeof text !== "string") {
    return [];
  }

  const expressions: DiscountExpression[] = [];

  for (const match of text.matchAll(discountPattern)) {
    const raw = match[0];
    const numberText = match[1];
    const start = match.index ?? 0;
    const numberStart = start + raw.indexOf(numberText);
    const numberEnd = numberStart + numberText.length;
    const percentage = Number(numberText);

    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      continue;
    }

    expressions.push({
      percentage,
      expression: raw,
      sourceId: "",
      excerpt: raw,
      start,
      end: start + raw.length,
      numberStart,
      numberEnd,
    });
  }

  return expressions;
}

export function withSourceId(
  expression: DiscountExpression,
  sourceId: string,
): DiscountExpression {
  return { ...expression, sourceId };
}

export function toDiscountValue(expression: DiscountExpression): DiscountValue {
  return {
    percentage: expression.percentage,
    expression: expression.expression,
  };
}

export function replacementFor(
  detected: DiscountExpression,
  expected: DiscountExpression | DiscountValue,
): string {
  const expectedText = formatPercentage(expected.percentage);
  return `${detected.expression.slice(0, detected.numberStart - detected.start)}${expectedText}${detected.expression.slice(detected.numberEnd - detected.start)}`;
}

export function referenceEvidence(
  reference: ReviewReference,
  expression: DiscountExpression,
  status: SupportingReference["status"],
): SupportingReference {
  const sourceExpression = withSourceId(expression, reference.id);
  return {
    referenceId: reference.id,
    referenceTitle: reference.title,
    evidence: sourceExpression,
    status,
  };
}
