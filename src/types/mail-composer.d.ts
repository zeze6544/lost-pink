declare module "nodemailer/lib/mail-composer" {
  export default class MailComposer {
    constructor(mail: object);
    compile(): {
      build(cb: (err: Error | null, message: Buffer) => void): void;
    };
  }
}
