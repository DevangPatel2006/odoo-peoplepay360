import nodemailer from 'nodemailer';
import env from '../../../config/env.js';

let transporter = null;

export const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user
        ? {
            user: env.smtp.user,
            pass: env.smtp.pass,
          }
        : undefined,
    });
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
  const mailer = getTransporter();

  const mailOptions = {
    from: env.smtp.from,
    to: payslip.work_email,
    subject: `Your Payslip for Period ${payslip.period_start} to ${payslip.period_end}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${payslip.employee_first_name || 'Employee'},</h2>
        <p>Your payslip for the period <strong>${payslip.period_start}</strong> to <strong>${payslip.period_end}</strong> has been generated.</p>
        <p><strong>Net Amount:</strong> $${parseFloat(payslip.net_amount || 0).toFixed(2)}</p>
        <p>Please find attached your detailed PDF payslip breakdown.</p>
        <br/>
        <p>Best regards,<br/><strong>PeoplePay360 HR & Payroll Team</strong></p>
      </div>
    `,
    attachments: [
      {
        filename: `Payslip_${payslip.period_start}_${payslip.period_end}.pdf`,
        path: pdfFilePath,
      },
    ],
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    return { success: true, messageId: info?.messageId || 'simulated' };
  } catch (err) {
    // In local dev/test environment without live SMTP credentials, log warning but do not crash the batch
    console.warn(`[MAILER_WARNING] Failed sending email to ${payslip.work_email}:`, err.message);
    return { success: false, error: err.message };
  }
};

export default {
  sendPayslipEmail,
};
