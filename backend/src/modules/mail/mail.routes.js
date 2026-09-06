import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { ok } from '../../common/utils/apiResponse.js';
import { getTransporter } from '../payroll/payslips/payslip.mailer.js';
import env from '../../config/env.js';
import nodemailer from 'nodemailer';

const router = Router();
router.use(authenticate);

router.post('/test', async (req, res) => {
  const targetEmail = req.body.to || req.user.email || 'admin@peoplepay360.com';
  const mailer = await getTransporter();

  const mailOptions = {
    from: env.smtp.from || 'no-reply@peoplepay360.com',
    to: targetEmail,
    subject: 'PeoplePay360 — SMTP Mail Delivery Verification',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <h2 style="color: #059669; margin: 0; font-size: 20px;">SMTP Test Successful!</h2>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
          Your <strong>PeoplePay360</strong> mail delivery pipeline is working properly. Automated emails (payslip PDF delivery, welcome login credentials, and payrun batch disbursements) are ready to send.
        </p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #475569;">
          <p style="margin: 4px 0;"><strong>SMTP Server:</strong> ${env.smtp.host}:${env.smtp.port}</p>
          <p style="margin: 4px 0;"><strong>From:</strong> ${env.smtp.from}</p>
          <p style="margin: 4px 0;"><strong>Delivered To:</strong> ${targetEmail}</p>
          <p style="margin: 4px 0;"><strong>Mode:</strong> ${env.smtp.user ? 'Authenticated SMTP Relay' : 'Ethereal Virtual Sandbox'}</p>
          <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>
    `,
  };

  const info = await mailer.sendMail(mailOptions);
  let previewUrl = null;
  if (mailer.isEthereal || nodemailer.getTestMessageUrl(info)) {
    previewUrl = nodemailer.getTestMessageUrl(info);
  }

  return ok(res, {
    success: true,
    message: `Test email dispatched to ${targetEmail}`,
    messageId: info?.messageId || 'simulated',
    previewUrl,
    host: env.smtp.host,
    port: env.smtp.port,
  });
});

export default router;
