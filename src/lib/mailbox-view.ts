import type {
  MailboxDisableReason,
  MailboxLifecycleStatus,
  MailboxPlan,
  ProvisionStep,
} from "./mailbox-status";
import {
  MIGADU_IMAP,
  MIGADU_SMTP,
  MIGADU_WEBMAIL_URL,
  SITE_FORGOT_PATH,
} from "./mailbox-settings";

export type OwnerMailboxView = {
  id: string;
  status: MailboxLifecycleStatus;
  plan: MailboxPlan | null;
  address: string;
  recoveryEmail: string | null;
  paidThrough: string | null;
  provisionStep: ProvisionStep | null;
  provisionAttempts: number;
  canRetry: boolean;
  canResumeCheckout: boolean;
  canClearCheckout: boolean;
  checkoutExpiresAt: string | null;
  checkoutAbandoned: boolean;
  hasPortal: boolean;
  webmailUrl: string;
  recoveryUrl: string;
  imap: typeof MIGADU_IMAP;
  smtp: typeof MIGADU_SMTP;
  disableReason: MailboxDisableReason | null;
};

export const MAILBOX_LINKS = {
  webmailUrl: MIGADU_WEBMAIL_URL,
  recoveryUrl: SITE_FORGOT_PATH,
  imap: MIGADU_IMAP,
  smtp: MIGADU_SMTP,
} as const;
