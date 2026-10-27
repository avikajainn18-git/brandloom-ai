import { MAX_ASSET_BYTES } from "./constants.ts";

export type TextFileReadResult =
  | { kind: "none"; content: null; filename: null; size: null }
  | { kind: "success"; content: string; filename: string; size: number }
  | { kind: "error"; error: string };

export function isFileEntry(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export async function readTextFile(file: File): Promise<TextFileReadResult> {
  if (!file.name) {
    return { kind: "none", content: null, filename: null, size: null };
  }
  if (!file.name.toLowerCase().endsWith(".txt")) {
    return { kind: "error", error: "Attach a .txt file only." };
  }
  if (file.size === 0) {
    return { kind: "error", error: "The selected text file is empty." };
  }
  if (file.size > MAX_ASSET_BYTES) {
    return { kind: "error", error: "Text files must be 1 MiB or smaller." };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!content.trim()) {
      return { kind: "error", error: "The selected text file is empty." };
    }
    return { kind: "success", content, filename: file.name, size: file.size };
  } catch {
    return { kind: "error", error: "The selected file is not valid UTF-8 text." };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
