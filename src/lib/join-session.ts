import { cookies } from "next/headers";
import { decryptSecret, encryptSecret } from "./mailbox-secret";
import { normalizePhone } from "./phone";

const COOKIE = "lost_join";
const TTL_MS = 30 * 60 * 1000;

type JoinProof = {
  mailboxId: string;
  phone: string;
  exp: number;
};

export async function setJoinPhoneProof(mailboxId: string, phone: string) {
  const e164 = normalizePhone(phone);
  if (!e164) return;
  const packed = encryptSecret(
    JSON.stringify({
      mailboxId,
      phone: e164,
      exp: Date.now() + TTL_MS,
    } satisfies JoinProof),
  );
  const store = await cookies();
  store.set(COOKIE, packed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function readJoinPhoneProof(
  mailboxId: string,
): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const json = decryptSecret(raw);
  if (!json) return null;
  try {
    const proof = JSON.parse(json) as JoinProof;
    if (proof.mailboxId !== mailboxId) return null;
    if (proof.exp < Date.now()) return null;
    return proof.phone;
  } catch {
    return null;
  }
}
