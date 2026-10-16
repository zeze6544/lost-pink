import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ATTACH_MAX_BYTES,
  ATTACH_MAX_FILES,
  attachKind,
  attachProblem,
  safeAttachName,
} from "./mail-attach";

test("outbound attachment validation accepts allowlisted files", () => {
  assert.equal(
    attachKind({ name: "photo.jpg", type: "image/jpeg" }),
    "image/jpeg",
  );
  assert.equal(
    attachKind({ name: "document.pdf", type: "" }),
    "application/pdf",
  );
  assert.equal(
    attachProblem(
      { name: "clip.mp4", type: "video/mp4", size: 1024 },
      [],
    ),
    null,
  );
});

test("outbound attachment validation rejects disguised or generic binaries", () => {
  assert.equal(
    attachKind({ name: "launch.exe", type: "application/pdf" }),
    null,
  );
  assert.equal(
    attachKind({ name: "document.pdf", type: "application/octet-stream" }),
    null,
  );
  assert.equal(
    attachKind({ name: "photo.jpg", type: "image/png" }),
    null,
  );
});

test("outbound attachment validation enforces count and total size", () => {
  assert.equal(
    attachProblem(
      { name: "extra.pdf", type: "application/pdf", size: 1 },
      Array.from({ length: ATTACH_MAX_FILES }, () => ({ size: 1 })),
    ),
    "four files is enough for one letter.",
  );
  assert.equal(
    attachProblem(
      { name: "extra.pdf", type: "application/pdf", size: 2 },
      [{ size: ATTACH_MAX_BYTES - 1 }],
    ),
    "keep attachments under 8MB.",
  );
});

test("attachment filenames drop paths and unsafe characters", () => {
  assert.equal(safeAttachName("../../hello\r\n.pdf"), "hello_.pdf");
});
