"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useActionState } from "react";
import type { AssetActionState } from "@/app/(workspace)/asset-actions";
import { MAX_ASSET_BYTES } from "@/lib/assets/constants";
import type { AssetRow } from "@/lib/data-access/assets";

type AssetAction = (
  previousState: AssetActionState,
  formData: FormData,
) => Promise<AssetActionState>;

const assetTypes = [
  ["email", "Email"],
  ["advertisement", "Advertisement"],
  ["social_post", "Social post"],
  ["landing_page", "Landing page"],
  ["other", "Other"],
] as const;

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function AssetForm({
  action,
  campaignId,
  asset,
}: {
  action: AssetAction;
  campaignId: string;
  asset?: AssetRow;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [content, setContent] = useState(asset?.text_content ?? "");
  const [sourceFilename, setSourceFilename] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(asset);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setLocalError(null);
      setSourceFilename(null);
      return;
    }

    setLocalError(null);
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setLocalError("Attach a .txt file only.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_ASSET_BYTES) {
      setLocalError("Text files must be 1 MiB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        setLocalError("The attached text file is empty.");
        event.target.value = "";
        return;
      }
      setContent(text);
      setSourceFilename(file.name);
    } catch {
      setLocalError("The attached file could not be read as text.");
      event.target.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setLocalError(null);
    if (!content.trim()) {
      event.preventDefault();
      setLocalError("Enter asset content or attach a non-empty .txt file.");
      return;
    }
    if (byteLength(content) > MAX_ASSET_BYTES) {
      event.preventDefault();
      setLocalError("Asset content must be 1 MiB or smaller.");
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-6 rounded-xl border bg-white p-6 sm:p-8"
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      {asset ? <input type="hidden" name="assetId" value={asset.id} /> : null}

      <div>
        <label htmlFor="asset-title" className="block text-sm font-medium text-[#3c3c3a]">
          Asset title
        </label>
        <input
          id="asset-title"
          name="title"
          required
          maxLength={160}
          defaultValue={asset?.title ?? ""}
          className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="e.g. Spring launch email"
        />
      </div>

      <div>
        <label htmlFor="asset-type" className="block text-sm font-medium text-[#3c3c3a]">
          Asset type
        </label>
        <select
          id="asset-type"
          name="assetType"
          required
          defaultValue={asset?.asset_type ?? "other"}
          className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
        >
          {assetTypes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border bg-[var(--surface-subtle)] p-4">
        <label htmlFor="asset-file" className="block text-sm font-medium text-[#3c3c3a]">
          Import a text file <span className="font-normal text-[var(--muted)]">(optional)</span>
        </label>
        <input
          ref={fileInputRef}
          id="asset-file"
          name="assetFile"
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-[#555550] file:mr-3 file:rounded-md file:border-0 file:bg-[#252525] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-[#41413e]"
        />
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          UTF-8 `.txt` files up to 1 MiB are supported. Imported text appears below so you can inspect or edit it before saving.
        </p>
        {sourceFilename ? (
          <p className="mt-2 text-xs font-medium text-[#456044]" role="status">
            Imported {sourceFilename}. The existing schema stores the extracted text, not the filename.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="asset-content" className="block text-sm font-medium text-[#3c3c3a]">
          Content text
        </label>
        <textarea
          id="asset-content"
          name="textContent"
          required
          maxLength={MAX_ASSET_BYTES}
          rows={14}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mt-2 block w-full resize-y rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm leading-6 text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="Paste the campaign content here, or import a .txt file above."
        />
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Content is stored as submitted and will not be analyzed until a later review phase.
        </p>
      </div>

      {localError || state.error ? (
        <p role="alert" className="rounded-lg border border-[#e4caca] bg-[#fff8f8] px-3 py-2.5 text-sm text-[#8d3f3f]">
          {localError || state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Link
          href={asset ? `/campaigns/${campaignId}/assets/${asset.id}` : `/campaigns/${campaignId}`}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-[#555550] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          {isPending ? "Saving…" : isEditing ? "Save changes" : "Save asset"}
        </button>
      </div>
    </form>
  );
}
