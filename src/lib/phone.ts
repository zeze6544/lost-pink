export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("0") && !digits.startsWith("00")) {
    digits = `+61${digits.slice(1)}`;
  }
  if (!digits.startsWith("+")) digits = `+${digits}`;
  const compact = `+${digits.slice(1).replace(/\D/g, "")}`;
  if (compact.length < 9 || compact.length > 16) return null;
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) return null;
  return compact;
}
