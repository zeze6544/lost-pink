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
        aria-label={`about ${label}`}
        aria-describedby={id}
      >
        i
      </button>
      <span id={id} role="tooltip" className="mailbox-offer-info-bubble">
        {explanation}
      </span>
    </span>
  );
}
