import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_ASSET_BYTES } from "../constants.ts";
import { formatFileSize, isFileEntry, readTextFile } from "../file-input.ts";
import { readAssetInput } from "../validation.ts";

function formData({
  content = "Manual campaign text",
  file,
}: {
  content?: string;
  file?: File;
} = {}) {
  const data = new FormData();
  data.set("title", "Campaign asset");
  data.set("assetType", "email");
  data.set("textContent", content);
  if (file) data.set("assetFile", file);
  return data;
}

test("valid manual text is accepted without a file", async () => {
  assert.deepEqual(await readAssetInput(formData()), {
    title: "Campaign asset",
    assetType: "email",
    textContent: "Manual campaign text",
  });
});

test("an empty multipart file placeholder is treated as no file", async () => {
  const data = formData();
  data.set("assetFile", new File([], ""));

  assert.deepEqual(await readAssetInput(data), {
    title: "Campaign asset",
    assetType: "email",
    textContent: "Manual campaign text",
  });
});

test("missing file with empty text reports required content, not an empty-file error", async () => {
  const result = await readAssetInput(formData({ content: "   " }));
  assert.deepEqual(result, {
    error: "Enter asset content or attach a non-empty .txt file.",
  });
});

test("valid text files expose filename, size, and extracted content", async () => {
  const file = new File(["Imported campaign text"], "campaign.txt", {
    type: "text/plain",
  });
  const result = await readTextFile(file);

  assert.deepEqual(result, {
    kind: "success",
    content: "Imported campaign text",
    filename: "campaign.txt",
    size: file.size,
  });
});

test("file detection accepts a file-like multipart value across realms", () => {
  const fileLike = {
    name: "cross-realm.txt",
    size: 7,
    arrayBuffer: async () => new ArrayBuffer(7),
  } as unknown as FormDataEntryValue;

  assert.equal(isFileEntry(fileLike), true);
});

test("a valid file can provide content when the editor field is absent", async () => {
  const data = new FormData();
  data.set("title", "Imported asset");
  data.set("assetType", "other");
  data.set("assetFile", new File(["File-only content"], "file-only.txt"));

  assert.deepEqual(await readAssetInput(data), {
    title: "Imported asset",
    assetType: "other",
    textContent: "File-only content",
  });
});

test("file content can be edited or replaced manually before persistence", async () => {
  const file = new File(["Imported text"], "campaign.txt", { type: "text/plain" });
  assert.deepEqual(await readAssetInput(formData({ content: "Edited imported text", file })), {
    title: "Campaign asset",
    assetType: "email",
    textContent: "Edited imported text",
  });
  assert.deepEqual(await readAssetInput(formData({ content: "Second file text" })), {
    title: "Campaign asset",
    assetType: "email",
    textContent: "Second file text",
  });
});

test("empty and whitespace-only files are rejected", async () => {
  for (const content of ["", " \t\n"]) {
    const result = await readTextFile(new File([content], "empty.txt"));
    assert.deepEqual(result, {
      kind: "error",
      error: "The selected text file is empty.",
    });
  }
});

test("unsupported files and files over 1 MiB are rejected", async () => {
  assert.deepEqual(
    await readTextFile(new File(["content"], "campaign.pdf")),
    { kind: "error", error: "Attach a .txt file only." },
  );
  assert.deepEqual(
    await readTextFile(new File([new Uint8Array(MAX_ASSET_BYTES + 1)], "large.txt")),
    { kind: "error", error: "Text files must be 1 MiB or smaller." },
  );
});

test("manual content is rejected when it exceeds the byte limit", async () => {
  const result = await readAssetInput(
    formData({ content: "x".repeat(MAX_ASSET_BYTES + 1) }),
  );
  assert.deepEqual(result, { error: "Asset content must be 1 MiB or smaller." });
});

test("file-size labels are readable", () => {
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(2048), "2 KB");
  assert.equal(formatFileSize(MAX_ASSET_BYTES), "1.0 MB");
});
