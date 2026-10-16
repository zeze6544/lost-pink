import assert from "node:assert/strict";
import { test } from "node:test";
import { extractMailAttachment, parseMailSource } from "./mail-mime";

const mixed = [
  "MIME-Version: 1.0",
  'Content-Type: multipart/mixed; boundary="outer"',
  "",
  "--outer",
  "Content-Type: text/plain; charset=utf-8",
  "Content-Transfer-Encoding: quoted-printable",
  "",
  "hello=20there",
  "--outer",
  'Content-Type: application/pdf; name="note.pdf"',
  "Content-Transfer-Encoding: base64",
  'Content-Disposition: attachment; filename="note.pdf"',
  "",
  Buffer.from("%PDF-test", "utf8").toString("base64"),
  "--outer",
  'Content-Type: image/gif; name="pixel.gif"',
  "Content-Transfer-Encoding: quoted-printable",
  'Content-Disposition: inline; filename="pixel.gif"',
  "",
  "GIF89a",
  "--outer--",
  "",
].join("\r\n");

test("parses safe base64 and quoted-printable received attachments", () => {
  const parsed = parseMailSource(mixed);
  assert.equal(parsed.text, "hello there");
  assert.deepEqual(
    parsed.attachments.map(({ partId, name, type, size }) => ({
      partId,
      name,
      type,
      size,
    })),
    [
      {
        partId: "2",
        name: "note.pdf",
        type: "application/pdf",
        size: 9,
      },
      {
        partId: "3",
        name: "pixel.gif",
        type: "image/gif",
        size: 6,
      },
    ],
  );

  const pdf = extractMailAttachment(mixed, "2");
  assert.equal(pdf?.content.toString("utf8"), "%PDF-test");
  const gif = extractMailAttachment(mixed, "3");
  assert.equal(gif?.content.toString("latin1"), "GIF89a");
});

test("does not expose unnamed inline, octet-stream, or executable attachments", () => {
  const raw = [
    "MIME-Version: 1.0",
    'Content-Type: multipart/mixed; boundary="x"',
    "",
    "--x",
    "Content-Type: image/png",
    "Content-Disposition: inline",
    "",
    "not listed",
    "--x",
    'Content-Type: application/octet-stream; name="document.pdf"',
    'Content-Disposition: attachment; filename="document.pdf"',
    "Content-Transfer-Encoding: base64",
    "",
    "cGRm",
    "--x",
    'Content-Type: application/pdf; name="launch.exe"',
    'Content-Disposition: attachment; filename="launch.exe"',
    "Content-Transfer-Encoding: base64",
    "",
    "ZXhl",
    "--x--",
    "",
  ].join("\r\n");

  const parsed = parseMailSource(raw);
  assert.deepEqual(parsed.attachments, []);
  assert.equal(parsed.skippedAttachments, 2);
});

test("caps received attachments at four", () => {
  const sections = Array.from({ length: 5 }, (_, index) =>
    [
      "--files",
      `Content-Type: image/png; name="photo-${index}.png"`,
      `Content-Disposition: attachment; filename="photo-${index}.png"`,
      "Content-Transfer-Encoding: base64",
      "",
      "eA==",
    ].join("\r\n"),
  );
  const raw = [
    "MIME-Version: 1.0",
    'Content-Type: multipart/mixed; boundary="files"',
    "",
    ...sections,
    "--files--",
    "",
  ].join("\r\n");

  const parsed = parseMailSource(raw);
  assert.equal(parsed.attachments.length, 4);
  assert.equal(parsed.skippedAttachments, 1);
  assert.equal(extractMailAttachment(raw, "5"), null);
});
