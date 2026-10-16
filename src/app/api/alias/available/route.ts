import { NextResponse } from "next/server";
import { checkAlias } from "@/lib/alias";
import { holdCountdownCopy } from "@/lib/voice";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const except = searchParams.get("except")?.trim() || undefined;
  const result = await checkAlias(q, except);
  if (result.status === "invalid") {
    return NextResponse.json({ status: "invalid", error: result.error });
  }
  if (result.status === "reserved") {
    return NextResponse.json({
      status: "reserved",
      error: `${result.local} is reserved.`,
      local: result.local,
    });
  }
  if (result.status === "taken") {
    return NextResponse.json({
      status: "taken",
      error: "that name is taken.",
      slug: result.slug,
      word: result.word,
      line: result.line,
    });
  }
  if (result.status === "held") {
    return NextResponse.json({
      status: "held",
      error: result.until
        ? holdCountdownCopy(result.until)
        : "someone’s holding that name.",
      until: result.until,
    });
  }
  return NextResponse.json({
    status: "free",
    local: result.local,
    email: `${result.local}@lost.pink`,
    page: `/${result.local}`,
  });
}
