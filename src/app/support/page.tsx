import type { ReactNode } from "react";
import { DocPage, DocSection } from "@/components/SiteFrame";
import { MAIL_GRACE_DAYS, PAYMENTS_VIA, REFUND_DAYS } from "@/lib/product-rules";

const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: "REACH",
    body: (
      <>
        <p>
          write{" "}
          <a
            href="mailto:support@lost.pink"
            className="underline underline-offset-2"
          >
            support@lost.pink
          </a>
          .
        </p>
        <p>include the page name</p>
        <p>and {PAYMENTS_VIA.toLowerCase()} order.</p>
      </>
    ),
  },
  {
    title: "SIGN IN",
    body: (
      <>
        <p>you@lost.pink + password.</p>
        <p>forgot? recovery email,</p>
        <p>not the inbox.</p>
      </>
    ),
  },
  {
    title: "SETUP",
    body: (
      <>
        <p>
          <a href="/setup" className="underline underline-offset-2">
            connect a mail app
          </a>
          .
        </p>
        <p>gmail app, apple mail,</p>
        <p>outlook, or manual.</p>
      </>
    ),
  },
  {
    title: "MAIL STUCK",
    body: (
      <>
        <p>confirm still paid.</p>
        <p>check spam. smtp uses</p>
        <p>smtp.migadu.com.</p>
      </>
    ),
  },
  {
    title: "BILLING",
    body: (
      <>
        <p>{PAYMENTS_VIA.toLowerCase()} handles money.</p>
        <p>refunds within {REFUND_DAYS} days.</p>
        <p>year renews till cancel.</p>
      </>
    ),
  },
  {
    title: "WHEN PAYMENT ENDS",
    body: (
      <>
        <p>inbox suspends.</p>
        <p>mail kept {MAIL_GRACE_DAYS} days —</p>
        <p>not wiped at once.</p>
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <DocPage title="support" wide>
      <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <DocSection key={section.title} title={section.title}>
            {section.body}
          </DocSection>
        ))}
      </div>
    </DocPage>
  );
}
