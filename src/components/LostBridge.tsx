"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { withBase } from "@/lib/hosts";

const LostBaseContext = createContext("");

export function LostBaseProvider({
  base,
  children,
}: {
  base: string;
  children: React.ReactNode;
}) {
  return (
    <LostBaseContext.Provider value={base}>
      {children}
      <LostBridge base={base} />
    </LostBaseContext.Provider>
  );
}

export function useLostHref() {
  const base = useContext(LostBaseContext);
  return useCallback((path: string) => withBase(base, path), [base]);
}

/**
 * On the /lost preview mount, root-relative links and /api fetches belong to
 * lost.pink. The lost host serves those paths at the root via middleware.
 */
function LostBridge({ base }: { base: string }) {
  useEffect(() => {
    if (!base) return;

    const prefixApi = (input: string) => {
      if (input.startsWith("/api/") || input.startsWith("/api?")) {
        return withBase(base, input);
      }
      return input;
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string") return originalFetch(prefixApi(input), init);
      if (input instanceof URL) {
        if (input.origin === window.location.origin) {
          const next = prefixApi(`${input.pathname}${input.search}`);
          if (next !== `${input.pathname}${input.search}`) {
            return originalFetch(next, init);
          }
        }
        return originalFetch(input, init);
      }
      const url = new URL(input.url);
      if (url.origin === window.location.origin) {
        const next = prefixApi(`${url.pathname}${url.search}`);
        if (next !== `${url.pathname}${url.search}`) {
          return originalFetch(new Request(next, input), init);
        }
      }
      return originalFetch(input, init);
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        !href.startsWith("/") ||
        href.startsWith("//") ||
        href.startsWith(base) ||
        href.startsWith("/_next")
      ) {
        return;
      }
      const next = withBase(base, href);
      if (next === href) return;
      event.preventDefault();
      if (anchor.target === "_blank") window.open(next);
      else window.location.assign(next);
    };

    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const action = form.getAttribute("action");
      if (!action || !action.startsWith("/") || action.startsWith(base)) return;
      form.setAttribute("action", withBase(base, action));
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      window.fetch = originalFetch;
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [base]);

  return null;
}
