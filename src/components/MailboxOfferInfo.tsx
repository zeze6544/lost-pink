"use client";

import { useId } from "react";

export function MailboxOfferInfo({
  label,
  explanation,
}: {
  label: string;
  explanation: string;
}) {
  const id = useId();
  return (
    <span className="mailbox-offer-info">
      <button
        type="button"
        className="mailbox-offer-info-trigger"
        aria-describedby={id}
        aria-label={`about ${label}`}
      >
        i
      </button>
      <span id={id} role="tooltip" className="mailbox-offer-info-bubble">
        {explanation}
      </span>
    </span>
  );
}
