import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Claim lives on home; /name remains as a redirect. */
export default function NameRedirect() {
  redirect("/");
}
