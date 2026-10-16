import { isMigaduConfigured } from "./site";

type MailboxPayload = {
  local_part: string;
  name?: string;
  password_method?: "invitation" | "password";
  password?: string;
  password_recovery_email?: string;
  may_send?: boolean;
  may_receive?: boolean;
  may_access_imap?: boolean;
  may_access_pop3?: boolean;
};

export type MailboxResult =
  | { ok: true; existed: boolean; invited: boolean }
  | { ok: false; error: string; transient: boolean };

function domain(): string {
  return process.env.MIGADU_DOMAIN!;
}

function mailboxUrl(localPart?: string): string {
  const base = `https://api.migadu.com/v1/domains/${encodeURIComponent(domain())}/mailboxes`;
  if (!localPart) return base;
  return `${base}/${encodeURIComponent(localPart)}`;
}

function isTransient(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function migadu(
  method: "GET" | "POST" | "PUT",
  url: string,
  body?: MailboxPayload,
): Promise<{ status: number; json: Record<string, unknown> | null }> {
  const user = process.env.MIGADU_USER!;
  const token = process.env.MIGADU_API_KEY!;
  const auth = Buffer.from(`${user}:${token}`).toString("base64");
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = { error: text };
    }
  }
  return { status: res.status, json };
}

function alreadyExists(status: number, json: Record<string, unknown> | null): boolean {
  if (status === 200 || status === 201) return false;
  const blob = JSON.stringify(json ?? {}).toLowerCase();
  return /already|exist|taken|duplicate/.test(blob);
}

export async function ensureMailbox(input: {
  localPart: string;
  name: string;
  recoveryEmail: string;
  password?: string;
}): Promise<MailboxResult> {
  if (!isMigaduConfigured()) {
    return { ok: false, error: "the inbox isn't ready yet.", transient: false };
  }

  const shown = await migadu("GET", mailboxUrl(input.localPart));
  if (shown.status === 200) {
    if (input.password) {
      const set = await setMailboxPassword(input.localPart, input.password);
      if (!set.ok) return set;
    }
    const enabled = await setMailboxLive(input.localPart);
    return enabled.ok
      ? { ok: true, existed: true, invited: false }
      : enabled;
  }
  if (isTransient(shown.status) && shown.status !== 404) {
    return {
      ok: false,
      error: "couldn't reach the inbox.",
      transient: true,
    };
  }

  const created = await migadu("POST", mailboxUrl(), {
    local_part: input.localPart,
    name: input.name,
    ...(input.password
      ? { password_method: "password", password: input.password }
      : {
          password_method: "invitation",
          password_recovery_email: input.recoveryEmail,
        }),
    password_recovery_email: input.recoveryEmail,
    may_send: true,
    may_receive: true,
    may_access_imap: true,
    may_access_pop3: true,
  });

  if (created.status === 200 || created.status === 201) {
    return { ok: true, existed: false, invited: !input.password };
  }
  if (alreadyExists(created.status, created.json)) {
    const enabled = await setMailboxLive(input.localPart);
    return enabled.ok
      ? { ok: true, existed: true, invited: false }
      : enabled;
  }

  const message =
    (typeof created.json?.error === "string" && created.json.error) ||
    "couldn't open the inbox.";
  console.error("migadu create failed", created.status, created.json);
  return {
    ok: false,
    error: message,
    transient: isTransient(created.status),
  };
}

export async function setMailboxPassword(
  localPart: string,
  password: string,
): Promise<MailboxResult> {
  if (!isMigaduConfigured()) {
    return { ok: false, error: "the inbox isn't ready yet.", transient: false };
  }
  const updated = await migadu("PUT", mailboxUrl(localPart), {
    local_part: localPart,
    password,
  });
  if (updated.status === 200) {
    return { ok: true, existed: true, invited: false };
  }
  return {
    ok: false,
    error: "couldn't reach the inbox.",
    transient: isTransient(updated.status),
  };
}

export async function setMailboxRecoveryEmail(
  localPart: string,
  recoveryEmail: string,
): Promise<MailboxResult> {
  if (!isMigaduConfigured()) {
    return { ok: false, error: "the inbox isn't ready yet.", transient: false };
  }
  const updated = await migadu("PUT", mailboxUrl(localPart), {
    local_part: localPart,
    password_recovery_email: recoveryEmail,
  });
  if (updated.status === 200) {
    return { ok: true, existed: true, invited: false };
  }
  return {
    ok: false,
    error: "couldn't reach the inbox.",
    transient: isTransient(updated.status),
  };
}

export async function setMailboxLive(localPart: string): Promise<MailboxResult> {
  return setMailboxAccess(localPart, true);
}

export async function setMailboxDark(localPart: string): Promise<MailboxResult> {
  return setMailboxAccess(localPart, false);
}

async function setMailboxAccess(
  localPart: string,
  live: boolean,
): Promise<MailboxResult> {
  if (!isMigaduConfigured()) {
    return { ok: false, error: "the inbox isn't ready yet.", transient: false };
  }

  const updated = await migadu("PUT", mailboxUrl(localPart), {
    local_part: localPart,
    may_send: live,
    may_receive: live,
    may_access_imap: live,
    may_access_pop3: live,
  });

  if (updated.status === 200) {
    return { ok: true, existed: true, invited: false };
  }

  console.error("migadu update failed", updated.status, updated.json);
  return {
    ok: false,
    error: "couldn't reach the inbox.",
    transient: isTransient(updated.status),
  };
}
