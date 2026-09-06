export const MIGADU_WEBMAIL_URL = "https://webmail.migadu.com/";
export const SITE_FORGOT_PATH = "/come/forgot";
export const SITE_RESET_PATH = "/come/reset";

export const MIGADU_IMAP = {
  host: "imap.migadu.com",
  port: 993,
  security: "SSL/TLS",
} as const;

export const MIGADU_SMTP = {
  host: "smtp.migadu.com",
  port: 465,
  security: "SSL/TLS",
} as const;
