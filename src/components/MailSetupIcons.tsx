import type { MailSetupClient } from "@/lib/mail-setup";

/** Small line icons for the mail-setup chooser (curated master page-09). */
export function MailSetupIcon({
  id,
  className = "h-4 w-4 shrink-0 text-[var(--ink)]",
}: {
  id: MailSetupClient;
  className?: string;
}) {
  switch (id) {
    case "gmail":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M2 3.5h12v9H2z"
            opacity="0.15"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            d="M2.5 4 8 8.5 13.5 4M2.5 4h11v8h-11z"
          />
          <text
            x="8"
            y="11.2"
            textAnchor="middle"
            fill="currentColor"
            fontSize="5.5"
            fontFamily="ui-monospace, monospace"
            fontWeight="600"
          >
            M
          </text>
        </svg>
      );
    case "iphone":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M8.2 1.6c-2.1 0-3.4 1.5-3.4 3.6 0 2.5 1.9 4.4 3.6 5.9.2.2.5.2.7 0 1.7-1.5 3.6-3.4 3.6-5.9 0-2.1-1.3-3.6-3.4-3.6-.6 0-1.2.2-1.6.6-.4-.4-1-.6-1.5-.6z"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            d="M5.2 13.2c.7-.7 1.7-1.1 2.8-1.1s2.1.4 2.8 1.1"
          />
        </svg>
      );
    case "outlook":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <rect
            x="2.5"
            y="3.5"
            width="11"
            height="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M2.5 4.5 8 8.5l5.5-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="5.2" cy="10.2" r="1.6" fill="currentColor" opacity="0.85" />
        </svg>
      );
    case "android":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <path
            fill="currentColor"
            d="M4.2 6.2h7.6v5.2c0 .7-.6 1.3-1.3 1.3H5.5c-.7 0-1.3-.6-1.3-1.3z"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            d="M5.2 4.2 4 2.8M10.8 4.2 12 2.8M3.2 7.5v3.2M12.8 7.5v3.2"
          />
          <circle cx="6.2" cy="5.2" r="0.55" fill="currentColor" />
          <circle cx="9.8" cy="5.2" r="0.55" fill="currentColor" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            d="M5 5.6c.7-.7 1.7-1.1 3-1.1s2.3.4 3 1.1"
          />
        </svg>
      );
    case "manual":
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <rect
            x="2.5"
            y="3.5"
            width="11"
            height="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M2.5 4.8 8 8.6l5.5-3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      );
  }
}
