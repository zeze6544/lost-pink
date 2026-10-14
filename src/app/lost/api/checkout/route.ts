import { NextRequest, NextResponse } from "next/server";
import { checkAlias } from "@/lib/alias";
import { parseMailboxPlan } from "@/lib/mailbox-lifecycle";
import {
  isMailboxCheckoutKind,
  mailboxCheckoutKind,
  mailboxProductId,
  isMailboxPolarConfigured,
} from "@/lib/mailbox-pricing";
import {
  attachCheckoutId,
  clearMailboxCheckout,
  getMailboxByPageId,
  mailboxStoreReady,
  markMailboxPaidAwaitingAccount,
  pageCanBuyMailbox,
  startMailboxCheckout,
} from "@/lib/mailbox-store";
import { getPageById, markKept, reserveKeptAlias } from "@/lib/pages";
import { startPolarCheckout } from "@/lib/polar";
import { isPolarConfigured, polarJoinSuccessUrl, siteUrl } from "@/lib/site";
import { getAuthUser } from "@/lib/supabase/server";
import type { CheckoutKind, MailboxPlan } from "@/lib/mailbox-status";

type LostPage = NonNullable<Awaited<ReturnType<typeof getPageById>>>;

function thanksKeepUrl(slug: string) {
  return `${siteUrl()}/thanks?slug=${encodeURIComponent(slug)}&kept=1`;
}

function asClient(
  mode: "json" | "redirect",
  polar: Response,
  extra?: { dev?: boolean },
) {
  if (mode === "redirect") return polar;
  const url = polar.headers.get("location");
  if (!url) {
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
  return NextResponse.json(extra?.dev ? { url, dev: true } : { url });
}

function finishLocal(
  mode: "json" | "redirect",
  url: string,
  extra?: { dev?: boolean },
) {
  if (mode === "redirect") return NextResponse.redirect(url);
  return NextResponse.json(extra?.dev ? { url, dev: true } : { url });
}

function parseKind(raw: string | null | undefined): CheckoutKind {
  if (raw === "mailbox_subscription") return "mailbox_subscription";
  if (raw === "mailbox_month") return "mailbox_month";
  if (raw === "mailbox_day") return "mailbox_day";
  if (raw === "mailbox_once" || raw === "mailbox") return "mailbox_once";
  return "keep";
}

export async function GET(request: NextRequest) {
  const alias = request.nextUrl.searchParams.get("alias")?.trim();
  const pageId = request.nextUrl.searchParams.get("pageId")?.trim();
  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  const action = request.nextUrl.searchParams.get("action");
  if (isMailboxCheckoutKind(kind)) {
    return mailboxCheckout(request, {
      alias,
      pageId,
      plan: parseMailboxPlan(kind) ?? "once",
      mode: "redirect",
      action,
    });
  }
  if (!pageId) {
    return NextResponse.json({ error: "Missing page." }, { status: 400 });
  }
  return runKeepCheckout(request, pageId, "redirect");
}

export async function POST(request: NextRequest) {
  let body: { pageId?: string; alias?: string; kind?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const kind = parseKind(body.kind);
  if (isMailboxCheckoutKind(kind)) {
    return mailboxCheckout(request, {
      alias: body.alias?.trim(),
      pageId: body.pageId?.trim(),
      plan: parseMailboxPlan(kind) ?? "once",
      mode: "json",
      action: body.action,
    });
  }
  const pageId = body.pageId?.trim();
  if (!pageId) {
    return NextResponse.json({ error: "Missing page." }, { status: 400 });
  }
  return runKeepCheckout(request, pageId, "json");
}

async function runKeepCheckout(
  request: NextRequest,
  pageId: string,
  mode: "json" | "redirect",
) {
  const page = await getPageById(pageId);
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  const keptUrl = thanksKeepUrl(page.slug);
  if (page.status === "kept") {
    return finishLocal(mode, keptUrl);
  }

  if (!isPolarConfigured() || !process.env.POLAR_PRODUCT_KEEP) {
    await markKept(page.id, "dev-local");
    return finishLocal(mode, keptUrl, { dev: true });
  }

  return asClient(
    mode,
    await startPolarCheckout(request, {
      productId: process.env.POLAR_PRODUCT_KEEP,
      metadata: {
        kind: "keep",
        page_id: page.id,
        slug: page.slug,
      },
      returnUrl: `${siteUrl()}/${page.slug}`,
    }),
  );
}

async function mailboxCheckout(
  request: NextRequest,
  input: {
    alias?: string;
    pageId?: string;
    plan: MailboxPlan;
    mode: "json" | "redirect";
    action?: string | null;
  },
) {
  if (!mailboxStoreReady()) {
    return NextResponse.json(
      { error: "the inbox isn't ready yet." },
      { status: 503 },
    );
  }

  let page: LostPage | null = input.pageId
    ? await getPageById(input.pageId)
    : null;
  const user = await getAuthUser();

  if (page && input.action === "clear") {
    if (user && page.owner_id && user.id === page.owner_id) {
      const existing = await getMailboxByPageId(page.id);
      if (!existing || existing.status !== "checkout_started") {
        return NextResponse.json({ error: "nothing to clear." }, { status: 409 });
      }
      await clearMailboxCheckout(page.id);
      return NextResponse.json({ cleared: true });
    }
  }

  if (!page) {
    const check = await checkAlias(input.alias ?? "");
    if (check.status === "invalid") {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    if (check.status === "taken") {
      return NextResponse.json({ error: "that name is taken." }, { status: 409 });
    }
    if (check.status === "held") {
      return NextResponse.json(
        { error: "someone’s holding that name." },
        { status: 409 },
      );
    }
    page = await reserveKeptAlias(check.local);
  }

  const existing = await getMailboxByPageId(page.id);
  const requestedPlan = parseMailboxPlan(input.plan) ?? input.plan;
  const renewing =
    existing?.status === "live" &&
    user &&
    page.owner_id === user.id;
  const guestBuy = !page.owner_id;

  if (!renewing && !guestBuy) {
    if (!user || user.id !== page.owner_id) {
      return NextResponse.json({ error: "sign in first." }, { status: 401 });
    }
    if (
      !pageCanBuyMailbox({
        kept: page.status === "kept",
        emailLocal: page.email_local ?? page.slug,
        mailbox: existing,
      }) &&
      existing?.status !== "checkout_started"
    ) {
      return NextResponse.json(
        { error: "that inbox is already open." },
        { status: 409 },
      );
    }
  }

  const emailLocal = page.email_local || page.slug;
  const mailbox = await startMailboxCheckout({
    pageId: page.id,
    emailLocal,
    recoveryEmail: user?.email ?? null,
    plan: requestedPlan,
  });

  const joinPath = `/join?mailbox=${encodeURIComponent(mailbox.id)}`;
  const productId = mailboxProductId(requestedPlan);
  if (!isMailboxPolarConfigured(requestedPlan) || !productId) {
    if (process.env.VERCEL_ENV === "production") {
      return NextResponse.json(
        { error: "that till isn’t open." },
        { status: 503 },
      );
    }
    await markMailboxPaidAwaitingAccount(mailbox.id, "dev-local");
    return finishLocal(input.mode, `${siteUrl()}${joinPath}`, { dev: true });
  }

  const polar = await startPolarCheckout(request, {
    productId,
    metadata: {
      kind: mailboxCheckoutKind(requestedPlan),
      page_id: page.id,
      mailbox_id: mailbox.id,
      slug: page.slug,
      email_local: emailLocal,
    },
    customerEmail: user?.email ?? undefined,
    returnUrl: `${siteUrl()}${joinPath}`,
    successUrl: polarJoinSuccessUrl(),
  });

  const location = polar.headers.get("location");
  const checkoutId = location
    ? /checkouts\/([a-zA-Z0-9_-]+)/.exec(location)?.[1]
    : null;
  if (checkoutId) {
    await attachCheckoutId(mailbox.id, checkoutId);
  }

  return asClient(input.mode, polar);
}
