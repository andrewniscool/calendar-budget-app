import nodemailer from 'nodemailer';

export function createMailService(config) {
  const transport = config.MAIL_MODE === 'smtp'
    ? nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.smtpSecure,
        auth: config.SMTP_USER
          ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
          : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });

  async function send({ to, subject, text }) {
    const result = await transport.sendMail({
      from: config.MAIL_FROM,
      to,
      subject,
      text,
    });
    if (config.MAIL_MODE === 'log') console.log(`Development email: ${result.message}`);
  }

  return {
    sendVerification(email, token) {
      const url = `${config.APP_ORIGIN}/?verify=${encodeURIComponent(token)}`;
      return send({
        to: email,
        subject: 'Verify your Calendar Budget account',
        text: `Verify your email address: ${url}`,
      });
    },
    sendPasswordReset(email, token) {
      const url = `${config.APP_ORIGIN}/?reset=${encodeURIComponent(token)}`;
      return send({
        to: email,
        subject: 'Reset your Calendar Budget password',
        text: `Reset your password: ${url}`,
      });
    },
  };
}
