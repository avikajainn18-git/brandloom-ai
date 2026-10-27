"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useActionState } from "react";
import type { AssetActionState } from "@/app/(workspace)/asset-actions";
import { MAX_ASSET_BYTES } from "@/lib/assets/constants";
import { formatFileSize, readTextFile } from "@/lib/assets/file-input";
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

type SelectedFile = {
  file: File;
  name: string;
  size: number;
};

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
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showServerError, setShowServerError] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const readRequestRef = useRef(0);
  const contentVersionRef = useRef(0);
  const isEditing = Boolean(asset);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      setLocalError(null);
      setShowServerError(false);
      return;
    }

    const requestId = ++readRequestRef.current;
    const contentVersionAtStart = contentVersionRef.current;
    setLocalError(null);
    setShowServerError(false);
    setSelectedFile({ file, name: file.name, size: file.size });
    setIsReadingFile(true);

    try {
      const result = await readTextFile(file);
      if (requestId !== readRequestRef.current) return;
      if (result.kind === "error") {
        setLocalError(result.error);
        setSelectedFile(null);
        input.value = "";
        return;
      }
      if (result.kind === "success") {
        if (contentVersionRef.current === contentVersionAtStart) {
          setContent(result.content);
          contentVersionRef.current += 1;
        }
        setSelectedFile({ file, name: result.filename, size: result.size });
      }
    } finally {
      if (requestId === readRequestRef.current) setIsReadingFile(false);
    }
  }

  function clearSelectedFile() {
    readRequestRef.current += 1;
    setIsReadingFile(false);
    setSelectedFile(null);
    setLocalError(null);
    setShowServerError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setLocalError(null);
    setShowServerError(true);
    if (isReadingFile) {
      event.preventDefault();
      setLocalError("Wait for the selected text file to finish loading.");
      return;
    }
    if (!content.trim()) {
      event.preventDefault();
      setLocalError("Enter asset content or attach a non-empty .txt file.");
      return;
    }
    if (byteLength(content) > MAX_ASSET_BYTES) {
      event.preventDefault();
      setLocalError("Asset content must be 1 MiB or smaller.");
      return;
    }

    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (selectedFile) {
      formData.set("assetFile", selectedFile.file);
    } else {
      formData.delete("assetFile");
    }
    formAction(formData);
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
        {isReadingFile ? (
          <p className="mt-2 text-xs font-medium text-[#62625e]" role="status" aria-live="polite">
            Reading selected text file…
          </p>
        ) : null}
        {selectedFile ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs" role="status" aria-busy={isReadingFile}>
            <p className="font-medium text-[#456044]">
              Selected {selectedFile.name} ({formatFileSize(selectedFile.size)})
              {isReadingFile ? " · Reading…" : ""}
            </p>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="font-medium text-[#62625e] underline underline-offset-4 hover:text-[#252525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
            >
              Clear selection
            </button>
          </div>
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
          onChange={(event) => {
            contentVersionRef.current += 1;
            setContent(event.target.value);
            setLocalError(null);
            setShowServerError(false);
          }}
          className="mt-2 block w-full resize-y rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm leading-6 text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
          placeholder="Paste the campaign content here, or import a .txt file above."
        />
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Content is stored as submitted and will not be analyzed until a later review phase.
        </p>
      </div>

      {localError || (showServerError ? state.error : undefined) ? (
        <p role="alert" className="rounded-lg border border-[#e4caca] bg-[#fff8f8] px-3 py-2.5 text-sm text-[#8d3f3f]">
          {localError || (showServerError ? state.error : undefined)}
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
          disabled={isPending || isReadingFile}
          className="inline-flex items-center justify-center rounded-lg bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#41413e] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          {isPending ? "Saving…" : isEditing ? "Save changes" : "Save asset"}
        </button>
      </div>
    </form>
  );
}
