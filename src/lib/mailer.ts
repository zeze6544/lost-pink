import MailComposer from "nodemailer/lib/mail-composer";
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

export async function sendPublicLetter(input: {
  to: string;
  toName: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "mail isn't ready yet." };
  }
  const name = input.fromName.replace(/"/g, "").slice(0, 80) || "someone";
  try {
    await transport().sendMail({
      from: `"${name} via lost.pink" <${supportFromAddress()}>`,
      to: `"${input.toName.replace(/"/g, "")}" <${input.to}>`,
      replyTo: input.fromEmail,
      subject: input.subject,
      text: [
        input.text,
        "",
        `written on lost.pink. reply goes to ${input.fromEmail}.`,
      ].join("\n"),
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "couldn't send that mail.";
    console.error("public letter failed", message);
    return { ok: false, error: "couldn't send that." };
  }
}

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

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
  attachments?: MailAttachment[];
}): Promise<{ ok: true; raw: Buffer } | { ok: false; error: string }> {
  try {
    const from = `"${input.fromName.replace(/"/g, "")}" <${input.user}>`;
    const mail = {
      from,
      to: input.to,
      cc: input.cc || undefined,
      subject: input.subject,
      text: input.text,
      html: input.html,
      inReplyTo: input.inReplyTo,
      references: input.references,
      attachments: input.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType,
      })),
    };
    const raw = await composeRaw(mail);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: input.user, pass: input.pass },
    });
    await transporter.sendMail({
      envelope: {
        from: input.user,
        to: [
          input.to,
          ...(input.cc
            ? input.cc
                .split(/[,;]/)
                .map((addr) => addr.trim())
                .filter(Boolean)
            : []),
        ],
      },
      raw,
    });
    return { ok: true, raw };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "couldn't send that mail.";
    console.error("user mail failed", message);
    return { ok: false, error: "couldn't send that." };
  }
}

function composeRaw(mail: object): Promise<Buffer> {
  const compiled = new MailComposer(mail).compile();
  return new Promise((resolve, reject) => {
    compiled.build((err: Error | null, message: Buffer) => {
      if (err) reject(err);
      else resolve(message);
    });
  });
}
