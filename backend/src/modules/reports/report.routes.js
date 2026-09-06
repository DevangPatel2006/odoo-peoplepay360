import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { generateExecutiveReportPdf } from './report.pdf.js';

const router = Router();
router.use(authenticate);

/**
 * GET /api/reports/executive/pdf
 * Generates and streams an executive workforce and payroll report PDF
 */
router.get('/executive/pdf', async (req, res) => {
  const period = req.query.period || '2026-09';
  const department = req.query.department || 'ALL';
  const employeeType = req.query.employeeType || 'ALL';

  const pdfBuffer = await generateExecutiveReportPdf(req.user.companyId, {
    period,
    department,
    employeeType,
  });

  const filename = `Executive_Workforce_Payroll_Report_${period}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  return res.send(pdfBuffer);
});

export default router;
