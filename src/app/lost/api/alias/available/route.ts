import { NextResponse } from "next/server";
import { checkAlias } from "@/lib/alias";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const result = await checkAlias(q);
  if (result.status === "invalid") {
    return NextResponse.json({ status: "invalid", error: result.error });
  }
  if (result.status === "taken") {
    return NextResponse.json({ status: "taken", error: "that name is taken." });
  }
  if (result.status === "held") {
    return NextResponse.json({
      status: "held",
      error: "someone’s holding that name.",
    });
  }
  return NextResponse.json({
    status: "free",
    local: result.local,
    email: `${result.local}@lost.pink`,
    page: `/${result.local}`,
  });
}
