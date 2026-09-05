import { ImapFlow } from "imapflow";
import { decryptSecret } from "./mailbox-secret";
import type { MailboxRow } from "./mailbox-store";
import type { MailFolder, MailLetter, MailListItem } from "./mail-types";
import { isMissingFolderError, MailImapError } from "./mail-errors";
import { extractMailAttachment, parseMailSource } from "./mail-mime";
import { displayLostEmail } from "./slug";

export type { MailFolder, MailLetter, MailListItem };

const HOST = "imap.migadu.com";

const FOLDER: Record<MailFolder, string[]> = {
  inbox: ["INBOX"],
  sent: ["Sent", "INBOX.Sent", "Sent Messages"],
  trash: ["Trash", "INBOX.Trash", "Deleted Messages"],
};

function clientFor(user: string, pass: string) {
  return new ImapFlow({
    host: HOST,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    disableAutoIdle: true,
  });
}

export function mailboxPass(row: MailboxRow): string | null {
  if (!row.password_secret) return null;
  return decryptSecret(row.password_secret);
}

export function mailboxUser(row: MailboxRow): string {
  return displayLostEmail(row.email_local);
}

async function withImap<T>(
  row: MailboxRow,
  run: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const pass = mailboxPass(row);
  if (!pass) {
    throw new MailImapError("provisioning", "Mailbox secret is unavailable.");
  }
  const client = clientFor(mailboxUser(row), pass);
  await client.connect();
  try {
    return await run(client);
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

async function openFolder(
  client: ImapFlow,
  folder: MailFolder,
  readOnly = false,
) {
  const names = FOLDER[folder];
  for (const name of names) {
    try {
      await client.mailboxOpen(name, { readOnly });
      return name;
    } catch (error) {
      if (isMissingFolderError(error)) continue;
      throw error;
    }
  }
  throw new MailImapError("folder", "No configured mailbox folder was found.");
}

function envelopeFrom(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const list = Array.isArray(value)
    ? value
    : "from" in (value as object)
      ? (value as { from?: unknown }).from
      : value;
  const first = Array.isArray(list) ? list[0] : list;
  if (!first || typeof first !== "object") return "";
  const row = first as { name?: string; address?: string };
  if (row.name && row.address) return `${row.name} <${row.address}>`;
  return row.address || row.name || "";
}

export type MailListResult = {
  items: MailListItem[];
  partial: boolean;
  skipped: number;
};

function listItemFromMessage(
  msg: {
    uid: number;
    envelope?: {
      from?: unknown;
      to?: unknown;
      subject?: string;
      date?: Date;
      messageId?: string;
      inReplyTo?: string;
    };
    flags?: Set<string>;
  },
  folder: MailFolder,
): MailListItem {
  if (!Number.isSafeInteger(msg.uid) || msg.uid <= 0) {
    throw new Error("Invalid message UID.");
  }
  const env = msg.envelope;
  let date: string | null = null;
  if (env?.date) {
    const timestamp = env.date.getTime();
    if (!Number.isFinite(timestamp)) throw new Error("Invalid message date.");
    date = env.date.toISOString();
  }
  return {
    uid: msg.uid,
    folder,
    from: envelopeFrom(env?.from),
    to: envelopeFrom(env?.to),
    subject: env?.subject || "(no subject)",
    date,
    seen: msg.flags?.has("\\Seen") ?? false,
    messageId: env?.messageId ?? null,
    inReplyTo: env?.inReplyTo ?? null,
  };
}

export async function listMail(
  row: MailboxRow,
  folder: MailFolder,
): Promise<MailListResult> {
  return withImap(row, async (client) => {
    await openFolder(client, folder, true);
    const box = client.mailbox;
    const exists = box ? box.exists : 0;
    if (!exists) return { items: [], partial: false, skipped: 0 };
    const start = Math.max(1, exists - 49);
    const expected = exists - start + 1;
    const items: MailListItem[] = [];
    let skipped = 0;
    try {
      for await (const msg of client.fetch(`${start}:*`, {
        envelope: true,
        uid: true,
        flags: true,
      })) {
        try {
          items.push(listItemFromMessage(msg, folder));
        } catch {
          skipped += 1;
        }
      }
    } catch (error) {
      if (!items.length) throw error;
      skipped = Math.max(skipped, expected - items.length);
    }
    items.sort((a, b) => b.uid - a.uid);
    return { items, partial: skipped > 0, skipped };
  });
}

export async function getMail(
  row: MailboxRow,
  folder: MailFolder,
  uid: number,
): Promise<MailLetter | null> {
  return withImap(row, async (client) => {
    await openFolder(client, folder);
    const msg = await client.fetchOne(
      String(uid),
      { envelope: true, uid: true, flags: true, source: true },
      { uid: true },
    );
    if (!msg) return null;
    const raw = msg.source ? msg.source.toString("latin1") : "";
    let parsed: ReturnType<typeof parseMailSource>;
    try {
      parsed = parseMailSource(raw);
    } catch {
      parsed = {
        text: "",
        html: null,
        attachments: [],
        skippedAttachments: 0,
      };
    }
    const env = msg.envelope;
    return {
      uid: msg.uid,
      folder,
      from: envelopeFrom(env?.from),
      to: envelopeFrom(env?.to),
      subject: env?.subject || "(no subject)",
      date: env?.date ? env.date.toISOString() : null,
      seen: true,
      messageId: env?.messageId ?? null,
      inReplyTo: env?.inReplyTo ?? null,
      text: parsed.text,
      html: parsed.html,
      attachments: parsed.attachments,
    };
  });
}

export async function getMailAttachment(
  row: MailboxRow,
  folder: MailFolder,
  uid: number,
  partId: string,
): Promise<ReturnType<typeof extractMailAttachment>> {
  return withImap(row, async (client) => {
    await openFolder(client, folder, true);
    const msg = await client.fetchOne(
      String(uid),
      { uid: true, source: true },
      { uid: true },
    );
    if (!msg || !msg.source) return null;
    return extractMailAttachment(msg.source.toString("latin1"), partId);
  });
}

export async function appendSent(
  row: MailboxRow,
  raw: string | Buffer,
): Promise<void> {
  await withImap(row, async (client) => {
    for (const name of FOLDER.sent) {
      try {
        await client.append(name, raw, ["\\Seen"]);
        return;
      } catch {
        continue;
      }
    }
    throw new Error("couldn't keep a copy.");
  });
}

export function rfc822Letter(input: {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const id = `<${Date.now()}.${Math.random().toString(36).slice(2)}@lost.pink>`;
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    input.cc ? `Cc: ${input.cc}` : null,
    `Subject: ${input.subject.replace(/\r?\n/g, " ")}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${id}`,
    input.inReplyTo ? `In-Reply-To: ${input.inReplyTo}` : null,
    input.references ? `References: ${input.references}` : null,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
  ].filter((line): line is string => Boolean(line));
  return `${headers.join("\r\n")}\r\n\r\n${input.text.replace(/\r?\n/g, "\r\n")}\r\n`;
}

export async function trashMail(
  row: MailboxRow,
  folder: MailFolder,
  uid: number,
): Promise<void> {
  await withImap(row, async (client) => {
    const from = await openFolder(client, folder);
    try {
      await client.messageMove(String(uid), FOLDER.trash[0], { uid: true });
    } catch {
      await client.messageFlagsAdd(String(uid), ["\\Deleted"], { uid: true });
      await client.messageDelete(String(uid), { uid: true });
    }
    void from;
  });
}

export async function countInbox(row: MailboxRow): Promise<number | null> {
  try {
    return await withImap(row, async (client) => {
      const status = await client.status("INBOX", { messages: true });
      const n = Number(status?.messages ?? 0);
      return Number.isFinite(n) ? n : 0;
    });
  } catch {
    return null;
  }
}
