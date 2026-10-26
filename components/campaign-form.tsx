"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { CampaignActionState } from "@/app/(workspace)/campaign-actions";

type CampaignAction = (
  previousState: CampaignActionState,
  formData: FormData,
) => Promise<CampaignActionState>;

export function CampaignForm({
  action,
  campaign,
}: {
  action: CampaignAction;
  campaign?: {
    id: string;
    name: string;
    description: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const isEditing = Boolean(campaign);

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-xl border bg-white p-6 sm:p-8">
      {campaign ? <input type="hidden" name="id" value={campaign.id} /> : null}
      <div>
        <label htmlFor="campaign-name" className="block text-sm font-medium text-[#3c3c3a]">
          Campaign name
        </label>
        <input
          id="campaign-name"
          name="name"
          required
          maxLength={160}
          defaultValue={campaign?.name ?? ""}
          className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="e.g. Spring product launch"
        />
      </div>
      <div>
        <label htmlFor="campaign-description" className="block text-sm font-medium text-[#3c3c3a]">
          Description <span className="font-normal text-[var(--muted)]">(optional)</span>
        </label>
        <textarea
          id="campaign-description"
          name="description"
          maxLength={2000}
          rows={5}
          defaultValue={campaign?.description ?? ""}
          className="mt-2 block w-full resize-y rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm leading-6 text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="Add context for the team reviewing this campaign."
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-[#e4caca] bg-[#fff8f8] px-3 py-2.5 text-sm text-[#8d3f3f]">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Link
          href={campaign ? `/campaigns/${campaign.id}` : "/campaigns"}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-[#555550] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          {isPending ? "Saving…" : isEditing ? "Save changes" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}
