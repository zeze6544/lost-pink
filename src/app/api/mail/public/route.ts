import { NextResponse } from "next/server";
import { sendPublicLetter } from "@/lib/mailer";
import { getMailboxByPageId } from "@/lib/mailbox-store";
import { getPageByHandle } from "@/lib/pages";
import { displayLostEmail } from "@/lib/slug";

export const runtime = "nodejs";
export const maxDuration = 30;

const sentAt = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function allowSend(id: string): boolean {
  const now = Date.now();
  const prev = (sentAt.get(id) ?? []).filter((t) => now - t < HOUR);
  if (prev.length >= 8) return false;
  prev.push(now);
  sentAt.set(id, prev);
  return true;
}

function validFrom(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: {
    slug?: string;
    from?: string;
    name?: string;
    subject?: string;
    text?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim().toLowerCase();
  const page = slug ? await getPageByHandle(slug) : null;
  if (!page) {
    return NextResponse.json({ error: "that page isn’t here." }, { status: 404 });
  }
  const mailbox = await getMailboxByPageId(page.id);
  if (!mailbox || mailbox.status !== "live") {
    return NextResponse.json({ error: "this inbox isn’t open." }, { status: 409 });
  }
  if (!allowSend(clientKey(request))) {
    return NextResponse.json(
      { error: "that's enough letters for now." },
      { status: 429 },
    );
  }

  const from = (body.from ?? "").trim().toLowerCase();
  if (!validFrom(from)) {
    return NextResponse.json(
      { error: "we need an email to reply to." },
      { status: 400 },
    );
  }
  const text = (body.text ?? "").trim();
  if (text.length < 2) {
    return NextResponse.json({ error: "write a little more." }, { status: 400 });
  }

  const sent = await sendPublicLetter({
    to: displayLostEmail(mailbox.email_local),
    toName: mailbox.display_name || page.word,
    fromEmail: from,
    fromName: (body.name ?? "").trim() || from.split("@")[0] || "someone",
    subject: (body.subject ?? "").trim() || `a letter for ${page.word}`,
    text: text.slice(0, 20_000),
  });
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
