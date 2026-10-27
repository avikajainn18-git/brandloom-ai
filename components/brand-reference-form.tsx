"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ReferenceActionState } from "@/app/(workspace)/reference-actions";
import type { BrandReferenceRow } from "@/lib/data-access/brand-references";

type ReferenceAction = (
  previousState: ReferenceActionState,
  formData: FormData,
) => Promise<ReferenceActionState>;

const referenceTypes = [
  ["campaign_brief", "Campaign brief"],
  ["brand_guidelines", "Brand guidelines"],
  ["terminology", "Terminology"],
  ["claim", "Claim"],
  ["fact", "Fact"],
  ["offer", "Offer"],
  ["other", "Other"],
] as const;

const approvalStatuses = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["superseded", "Superseded"],
] as const;

export function BrandReferenceForm({
  action,
  campaignId,
  reference,
}: {
  action: ReferenceAction;
  campaignId: string;
  reference?: BrandReferenceRow;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const isEditing = Boolean(reference);

  return (
    <form action={formAction} className="max-w-3xl space-y-6 rounded-xl border bg-white p-6 sm:p-8">
      <input type="hidden" name="campaignId" value={campaignId} />
      {reference ? <input type="hidden" name="referenceId" value={reference.id} /> : null}

      <div>
        <label htmlFor="reference-title" className="block text-sm font-medium text-[#3c3c3a]">
          Reference title
        </label>
        <input
          id="reference-title"
          name="title"
          required
          maxLength={160}
          defaultValue={reference?.title ?? ""}
          className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="e.g. Spring offer brief"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="reference-type" className="block text-sm font-medium text-[#3c3c3a]">
            Reference type
          </label>
          <select
            id="reference-type"
            name="referenceType"
            required
            defaultValue={reference?.reference_type ?? "other"}
            className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          >
            {referenceTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reference-approval" className="block text-sm font-medium text-[#3c3c3a]">
            Approval status
          </label>
          <select
            id="reference-approval"
            name="approvalStatus"
            required
            defaultValue={reference?.approval_status ?? "pending"}
            className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          >
            {approvalStatuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="reference-content" className="block text-sm font-medium text-[#3c3c3a]">
          Approved content
        </label>
        <textarea
          id="reference-content"
          name="content"
          required
          maxLength={50000}
          rows={10}
          defaultValue={reference?.content ?? ""}
          className="mt-2 block w-full resize-y rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm leading-6 text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="Record the approved guidance, fact, claim, offer, or terminology."
        />
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Keep the source wording intact. Embedded instructions in reference content do not change application rules.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="reference-authority" className="block text-sm font-medium text-[#3c3c3a]">
            Authority <span className="font-normal text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="reference-authority"
            name="authority"
            maxLength={200}
            defaultValue={reference?.authority ?? ""}
            className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
            placeholder="e.g. Legal review"
          />
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Human-defined label; the application does not infer authority.</p>
        </div>
        <div>
          <label htmlFor="reference-precedence" className="block text-sm font-medium text-[#3c3c3a]">
            Precedence <span className="font-normal text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="reference-precedence"
            name="precedence"
            type="number"
            min={0}
            step={1}
            defaultValue={reference?.precedence ?? ""}
            className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
            placeholder="e.g. 10"
          />
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Higher values take precedence; equal or blank values remain unresolved.</p>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg border border-[#e4caca] bg-[#fff8f8] px-3 py-2.5 text-sm text-[#8d3f3f]">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Link
          href={reference ? `/campaigns/${campaignId}/references/${reference.id}` : `/campaigns/${campaignId}`}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-[#555550] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          {isPending ? "Saving…" : isEditing ? "Save changes" : "Save reference"}
        </button>
      </div>
    </form>
  );
}
