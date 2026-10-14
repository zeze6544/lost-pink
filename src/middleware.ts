import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isJawsHost,
  isLostHost,
  JAWS_MOUNT,
  LOST_MOUNT,
} from "@/lib/hosts";
import {
  isAuthConfigured,
  supabasePublicUrl,
  supabasePublishableKey,
} from "@/lib/site";

function requestHost(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim();
}

function under(pathname: string, mount: string): boolean {
  return pathname === mount || pathname.startsWith(`${mount}/`);
}

export async function middleware(request: NextRequest) {
  const host = requestHost(request);
  const { pathname } = request.nextUrl;
  const lostHost = isLostHost(host);
  const jawsHost = isJawsHost(host);

  const requestHeaders = new Headers(request.headers);
  let rewritePath: string | null = null;

  if (pathname.startsWith("/api/") && !under(pathname, `${LOST_MOUNT}/api`)) {
    requestHeaders.set("x-lost-base", "");
    requestHeaders.set("x-site", "lost");
    rewritePath = `${LOST_MOUNT}${pathname}`;
  } else if (jawsHost && !under(pathname, JAWS_MOUNT)) {
    requestHeaders.set("x-lost-base", "");
    requestHeaders.set("x-site", "jaws");
    rewritePath = pathname === "/" ? JAWS_MOUNT : `${JAWS_MOUNT}${pathname}`;
  } else if (lostHost && !under(pathname, LOST_MOUNT)) {
    requestHeaders.set("x-lost-base", "");
    requestHeaders.set("x-site", "lost");
    rewritePath = pathname === "/" ? LOST_MOUNT : `${LOST_MOUNT}${pathname}`;
  } else if (under(pathname, LOST_MOUNT)) {
    requestHeaders.set("x-lost-base", lostHost ? "" : LOST_MOUNT);
    requestHeaders.set("x-site", "lost");
  } else if (under(pathname, JAWS_MOUNT)) {
    requestHeaders.set("x-lost-base", "");
    requestHeaders.set("x-site", "jaws");
  } else {
    requestHeaders.set("x-lost-base", "");
    requestHeaders.set("x-site", "apex");
  }

  const url = request.nextUrl.clone();
  if (rewritePath) url.pathname = rewritePath;

  const build = () =>
    rewritePath
      ? NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  let response = build();

  const refreshAuth =
    lostHost ||
    under(pathname, LOST_MOUNT) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith(`${LOST_MOUNT}/api/`);

  if (!refreshAuth || !isAuthConfigured()) return response;

  const supabaseUrl = supabasePublicUrl();
  const key = supabasePublishableKey();
  if (!supabaseUrl || !key) return response;

  const supabase = createServerClient(supabaseUrl, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = build();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
