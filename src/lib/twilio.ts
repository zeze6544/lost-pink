import { normalizePhone } from "./phone";

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

function authHeader(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

function serviceUrl(path: string): string {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID!;
  return `https://verify.twilio.com/v2/Services/${sid}/${path}`;
}

export async function sendPhoneCode(
  phone: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const e164 = normalizePhone(phone);
  if (!e164) return { ok: false, error: "that doesn’t look like a phone." };
  if (!isTwilioConfigured()) return { ok: true };

  const body = new URLSearchParams({ To: e164, Channel: "sms" });
  const res = await fetch(serviceUrl("Verifications"), {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    console.error("twilio verify send", res.status, await res.text());
    return { ok: false, error: "couldn't send that. try again in a moment." };
  }
  return { ok: true };
}

export async function checkPhoneCode(
  phone: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const e164 = normalizePhone(phone);
  if (!e164) return { ok: false, error: "that doesn’t look like a phone." };
  const trimmed = code.trim();
  if (!/^\d{4,8}$/.test(trimmed)) {
    return { ok: false, error: "that code isn’t right." };
  }
  if (!isTwilioConfigured()) {
    return trimmed === "000000"
      ? { ok: true }
      : { ok: false, error: "that code isn’t right." };
  }

  const body = new URLSearchParams({ To: e164, Code: trimmed });
  const res = await fetch(serviceUrl("VerificationCheck"), {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await res.json().catch(() => null)) as {
    status?: string;
  } | null;
  if (json?.status === "approved") return { ok: true };
  return { ok: false, error: "that code isn’t right." };
}
