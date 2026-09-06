import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Claim lives on Home — do not invent a parallel surface. */
export default function NamePage() {
  redirect("/");
}
