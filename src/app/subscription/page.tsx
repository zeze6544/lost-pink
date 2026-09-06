import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Billing is the canonical surface; /subscription remains as a redirect. */
export default function SubscriptionRedirect() {
  redirect("/billing");
}
