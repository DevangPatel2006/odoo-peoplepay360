import nodemailer from 'nodemailer';
import env from '../../config/env.js';

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
};

export const sendWelcomeCredentialsEmail = async ({ work_email, first_name, temporary_password }) => {
  if (!env.smtp.user || !env.smtp.pass) {
    return { success: true, messageId: 'simulated-unconfigured-smtp' };
  }
  const mailer = getTransporter();
  const mailOptions = {
    from: env.smtp.from,
    to: work_email,
    subject: 'Welcome to PeoplePay360 — Your Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
        <h2>Welcome, ${first_name}!</h2>
        <p>Your PeoplePay360 account has been created.</p>
        <p><strong>Login Email:</strong> ${work_email}<br/>
           <strong>Temporary Password:</strong> ${temporary_password}</p>
        <p>Please sign in and change this password as soon as possible.</p>
        <p>Best regards,<br/><strong>PeoplePay360 HR & Payroll Team</strong></p>
      </div>
    `,
  };
  try {
    const info = await mailer.sendMail(mailOptions);
    return { success: true, messageId: info?.messageId || 'simulated' };
  } catch (err) {
    console.warn(`[MAILER_WARNING] Failed sending welcome email to ${work_email}:`, err.message);
    return { success: false, error: err.message };
  }
};

export default { sendWelcomeCredentialsEmail };
