export type MailErrorKind =
  | "provisioning"
  | "auth"
  | "folder"
  | "timeout"
  | "connection"
  | "unknown";

export type MailErrorClassification = {
  kind: MailErrorKind;
  error: string;
  status: number;
  retryable: boolean;
};

export class MailImapError extends Error {
  readonly kind: MailErrorKind;

  constructor(kind: MailErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MailImapError";
    this.kind = kind;
  }
}

function errorText(error: unknown): string {
  if (!error || typeof error !== "object") return String(error ?? "");
  const row = error as Record<string, unknown>;
  return [
    row.name,
    row.code,
    row.responseCode,
    row.responseStatus,
    row.responseText,
    row.serverResponseCode,
    row.message,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

export function isMissingFolderError(error: unknown): boolean {
  const text = errorText(error);
  return (
    /\bnonexistent\b/.test(text) ||
    /no such (mailbox|folder)/.test(text) ||
    /(mailbox|folder).*(does not exist|doesn't exist|not found)/.test(text) ||
    /unknown (mailbox|folder)/.test(text)
  );
}

export function classifyMailError(error: unknown): MailErrorClassification {
  if (error instanceof MailImapError) {
    if (error.kind === "provisioning") {
      return {
        kind: "provisioning",
        error: "the inbox is still arriving.",
        status: 409,
        retryable: true,
      };
    }
    if (error.kind === "folder") {
      return {
        kind: "folder",
        error: "that folder isn't available.",
        status: 502,
        retryable: false,
      };
    }
  }

  const text = errorText(error);
  if (
    /authenticationfailed|authentication failed|invalid credentials/.test(text) ||
    /\bauth\b.*\b(fail|invalid|denied)\b/.test(text) ||
    /\blogin\b.*\b(fail|invalid|denied)\b/.test(text)
  ) {
    return {
      kind: "auth",
      error: "the inbox credentials were rejected.",
      status: 502,
      retryable: false,
    };
  }
  if (isMissingFolderError(error)) {
    return {
      kind: "folder",
      error: "that folder isn't available.",
      status: 502,
      retryable: false,
    };
  }
  if (
    /\betimedout\b|\besockettimedout\b|timed out|timeout/.test(text)
  ) {
    return {
      kind: "timeout",
      error: "the mail server took too long.",
      status: 504,
      retryable: true,
    };
  }
  if (
    /\beconnreset\b|\beconnrefused\b|\behostunreach\b|\benetunreach\b|\bepipe\b|\bdns\b/.test(
      text,
    )
  ) {
    return {
      kind: "connection",
      error: "couldn't reach the mail server.",
      status: 502,
      retryable: true,
    };
  }
  return {
    kind: "unknown",
    error: "couldn't load mail.",
    status: 502,
    retryable: true,
  };
}
