import { validRecoveryEmail } from "./slug";

export function mergeRecoveryEmail(
  existing: string | null | undefined,
  candidate: string | null | undefined,
): string | null {
  const current = existing?.trim().toLowerCase() || null;
  const next = candidate?.trim().toLowerCase() || null;
  if (next && validRecoveryEmail(next)) return next;
  return current && validRecoveryEmail(current) ? current : null;
}
