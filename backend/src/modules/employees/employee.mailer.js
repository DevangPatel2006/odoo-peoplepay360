import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import { getTransporter } from '../payroll/payslips/payslip.mailer.js';

export const sendWelcomeCredentialsEmail = async ({ work_email, first_name, temporary_password }) => {
  const mailer = await getTransporter();

  const mailOptions = {
    from: env.smtp.from || 'no-reply@peoplepay360.com',
    to: work_email,
    subject: 'Welcome to PeoplePay360 — Your Account & Access Credentials',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 32px; color: #FFFFFF;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">PeoplePay360</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #A7F3D0;">Enterprise Workforce Portal Invitation</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #0F172A;">Welcome, ${first_name}!</h2>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">
            Your employee profile on <strong>PeoplePay360</strong> has been provisioned. You can now sign in to review your payslip statements, submit time-off requests, and track your attendance.
          </p>
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #166534;"><strong>Sign-In Credentials:</strong></p>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="color: #475569; padding: 4px 0; width: 140px;">Work Email:</td>
                <td style="font-weight: 600; color: #0F172A; padding: 4px 0;">${work_email}</td>
              </tr>
              <tr>
                <td style="color: #475569; padding: 4px 0;">Temporary Password:</td>
                <td style="font-family: monospace; font-size: 15px; font-weight: 700; color: #059669; padding: 4px 0;">${temporary_password}</td>
              </tr>
            </table>
          </div>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
            Please log in and update your password immediately upon your first sign-in.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center;">
            PeoplePay360 HR & Payroll Platform • All Rights Reserved
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    let previewUrl = null;
    if (mailer.isEthereal || nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[MAILER] Welcome credentials preview for ${work_email} at:`, previewUrl);
    }
    return {
      success: true,
      messageId: info?.messageId || 'simulated',
      previewUrl,
    };
  } catch (err) {
    console.warn(`[MAILER_WARNING] Failed sending welcome email to ${work_email}:`, err.message);
    return { success: false, error: err.message };
  }
};

export default { sendWelcomeCredentialsEmail };
