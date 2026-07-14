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
        connectionTimeout: config.SMTP_CONNECTION_TIMEOUT_MS,
        socketTimeout: config.SMTP_SOCKET_TIMEOUT_MS,
      })
    : nodemailer.createTransport({ jsonTransport: true });

  async function send({ to, subject, text }) {
    const result = await transport.sendMail({
      from: config.MAIL_FROM,
      to,
      subject,
      text,
    });
    return result;
  }

  return {
    sendJob(job) {
      if (job.type === 'email_verification') {
        const url = `${config.APP_ORIGIN}/?verify=${encodeURIComponent(job.payload.token)}`;
        return send({
          to: job.recipient,
          subject: 'Verify your Calendar Budget account',
          text: `Verify your email address: ${url}`,
        });
      }
      if (job.type === 'password_reset') {
        const url = `${config.APP_ORIGIN}/?reset=${encodeURIComponent(job.payload.token)}`;
        return send({
          to: job.recipient,
          subject: 'Reset your Calendar Budget password',
          text: `Reset your password: ${url}`,
        });
      }
      throw new Error(`Unsupported mail job type: ${job.type}`);
    },
  };
}
