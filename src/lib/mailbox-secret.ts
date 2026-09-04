import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

function secretMaterial(): string {
  return (
    process.env.MAILBOX_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "dev-mailbox-secret"
  );
}

function key(): Buffer {
  return scryptSync(secretMaterial(), "lost.pink.mailbox", 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(".");
}

export function decryptSecret(packed: string): string | null {
  const [version, ivB64, tagB64, encB64] = packed.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !encB64) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      Buffer.from(ivB64, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(encB64, "base64url")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
