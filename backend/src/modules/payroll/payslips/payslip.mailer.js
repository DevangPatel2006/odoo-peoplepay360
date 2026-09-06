import nodemailer from 'nodemailer';
import env from '../../../config/env.js';

let transporter = null;

export const getTransporter = async () => {
  if (!transporter) {
    if (env.smtp.user && env.smtp.pass) {
      transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
      });
    } else {
      // In development or when credentials are not yet entered in .env,
      // create an ephemeral Ethereal test account so emails work and can be previewed!
      try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('[MAILER] Initialized Ethereal test account:', testAccount.user);
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        transporter.isEthereal = true;
      } catch (err) {
        console.warn('[MAILER] Ethereal account creation failed, fallback to simulated:', err.message);
        transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }
  }
  return transporter;
};

/**
 * Sends a Payslip PDF via Email to the Employee
 *
 * @param {object} payslip - Payslip data including work_email, first_name, period_start, period_end
 * @param {string} pdfFilePath - Absolute path to the payslip PDF file
 * @returns {Promise<object>}
 */
export const sendPayslipEmail = async (payslip, pdfFilePath) => {
  const mailer = await getTransporter();

  const recipient = payslip.work_email;
  const empName = `${payslip.employee_first_name || ''} ${payslip.employee_last_name || ''}`.trim() || 'Valued Employee';

  const mailOptions = {
    from: env.smtp.from || 'no-reply@peoplepay360.com',
    to: recipient,
    subject: `Your Payslip for Period ${payslip.period_start} to ${payslip.period_end} — PeoplePay360`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 28px 32px; color: #FFFFFF;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">PeoplePay360</h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">Official Enterprise Payroll Statement</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; color: #0F172A;">Hello ${empName},</h2>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">
            Your payslip statement for the pay cycle <strong>${payslip.period_start}</strong> to <strong>${payslip.period_end}</strong> has been computed, finalized, and processed.
          </p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="color: #64748B; padding: 6px 0;">Payslip Reference:</td>
                <td style="text-align: right; font-weight: 600; color: #0F172A; padding: 6px 0;">#${payslip.id}</td>
              </tr>
              <tr>
                <td style="color: #64748B; padding: 6px 0;">Gross Earnings:</td>
                <td style="text-align: right; font-weight: 600; color: #0F172A; padding: 6px 0;">$${parseFloat(payslip.gross_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="color: #64748B; padding: 6px 0;">Net Disbursed:</td>
                <td style="text-align: right; font-weight: 700; color: #059669; font-size: 16px; padding: 6px 0;">$${parseFloat(payslip.net_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </div>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
            Please find your official, tamper-evident PDF payslip breakdown attached to this message for your records.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center;">
            This is an automated system notification from PeoplePay360. If you have questions regarding your deductions or withholding, contact your HR Payroll Administrator.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Payslip_${payslip.employee_code || payslip.id}_${payslip.period_start}.pdf`,
        path: pdfFilePath,
      },
    ],
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    let previewUrl = null;
    if (mailer.isEthereal || nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[MAILER] Preview email for ${recipient} at:`, previewUrl);
    }
    return {
      success: true,
      messageId: info?.messageId || 'simulated',
      previewUrl,
    };
  } catch (err) {
    console.warn(`[MAILER_WARNING] Failed sending email to ${recipient}:`, err.message);
    return { success: false, error: err.message };
  }
};

export default {
  getTransporter,
  sendPayslipEmail,
};
