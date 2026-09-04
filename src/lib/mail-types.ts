export type MailFolder = "inbox" | "sent" | "trash";

export type MailListItem = {
  uid: number;
  folder: MailFolder;
  from: string;
  to: string;
  subject: string;
  date: string | null;
  seen: boolean;
  messageId: string | null;
  inReplyTo: string | null;
};

export type MailLetter = MailListItem & {
  text: string;
  html: string | null;
};
