import { NextResponse } from "next/server";
import { expireFreePages } from "@/lib/pages";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const removed = await expireFreePages();
  return NextResponse.json({ removed });
}
