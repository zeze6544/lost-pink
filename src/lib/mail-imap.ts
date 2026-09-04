import { ImapFlow } from "imapflow";
import { decryptSecret } from "./mailbox-secret";
import type { MailboxRow } from "./mailbox-store";
import type { MailFolder, MailLetter, MailListItem } from "./mail-types";
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
  if (!pass) throw new Error("the inbox isn't ready yet.");
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

async function openFolder(client: ImapFlow, folder: MailFolder) {
  const names = FOLDER[folder];
  for (const name of names) {
    try {
      await client.mailboxOpen(name);
      return name;
    } catch {
      continue;
    }
  }
  throw new Error("couldn't open that drawer.");
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

export async function listMail(
  row: MailboxRow,
  folder: MailFolder,
): Promise<MailListItem[]> {
  return withImap(row, async (client) => {
    await openFolder(client, folder);
    const box = client.mailbox;
    const exists = box ? box.exists : 0;
    if (!exists) return [];
    const start = Math.max(1, exists - 49);
    const items: MailListItem[] = [];
    for await (const msg of client.fetch(`${start}:*`, {
      envelope: true,
      uid: true,
      flags: true,
    })) {
      const env = msg.envelope;
      items.push({
        uid: msg.uid,
        folder,
        from: envelopeFrom(env?.from),
        to: envelopeFrom(env?.to),
        subject: env?.subject || "(no subject)",
        date: env?.date ? env.date.toISOString() : null,
        seen: msg.flags?.has("\\Seen") ?? false,
        messageId: env?.messageId ?? null,
        inReplyTo: env?.inReplyTo ?? null,
      });
    }
    items.sort((a, b) => b.uid - a.uid);
    return items;
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
    const raw = msg.source ? msg.source.toString("utf8") : "";
    const parsed = splitRaw(raw);
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
    };
  });
}

export async function appendSent(
  row: MailboxRow,
  raw: string,
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

function splitRaw(raw: string): { text: string; html: string | null } {
  const htmlMatch = /<html[\s\S]*<\/html>/i.exec(raw);
  const html = htmlMatch ? htmlMatch[0] : null;
  const textPart = raw
    .replace(/^[\s\S]*?\r?\n\r?\n/, "")
    .replace(/--[a-zA-Z0-9'()+_,-./:=?]+\r?\n/g, "\n")
    .replace(/Content-Type:[\s\S]*?\r?\n\r?\n/gi, "\n");
  const text = textPart
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim()
    .slice(0, 20_000);
  return { text, html };
}
