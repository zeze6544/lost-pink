import nodemailer from "nodemailer";
import { isSmtpConfigured } from "./site";

const SMTP_HOST = "smtp.migadu.com";
const SMTP_PORT = 465;

export function supportFromAddress(): string {
  return process.env.MIGADU_SMTP_USER?.trim() || "support@lost.pink";
}

export function alertToAddress(): string | null {
  return process.env.MAILBOX_ALERT_TO?.trim() || null;
}

function transport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.MIGADU_SMTP_USER,
      pass: process.env.MIGADU_SMTP_PASSWORD,
    },
  });
}

export async function sendLifecycleMail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "mail isn't ready yet." };
  }
  try {
    await transport().sendMail({
      from: `"lost.pink" <${supportFromAddress()}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "couldn't send that mail.";
    console.error("lifecycle mail failed", message);
    return { ok: false, error: message };
  }
}

export async function sendUserMail(input: {
  user: string;
  pass: string;
  fromName: string;
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: input.user, pass: input.pass },
    });
    await transporter.sendMail({
      from: `"${input.fromName.replace(/"/g, "")}" <${input.user}>`,
      to: input.to,
      cc: input.cc || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html,
      inReplyTo: input.inReplyTo,
      references: input.references,
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "couldn't send that mail.";
    console.error("user mail failed", message);
    return { ok: false, error: "couldn't send that." };
  }
}
