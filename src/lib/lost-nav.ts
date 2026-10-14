import { headers } from "next/headers";
import { lostBaseFromHeader, withBase } from "@/lib/hosts";

export async function currentLostBase(): Promise<string> {
  const h = await headers();
  return lostBaseFromHeader(h.get("x-lost-base"));
}

export async function lostPath(path: string): Promise<string> {
  return withBase(await currentLostBase(), path);
}
