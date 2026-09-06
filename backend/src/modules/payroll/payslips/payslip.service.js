import fs from 'fs';
import { query } from '../../../config/db.js';
import payrollModel from '../payroll.model.js';
import { generatePayslipPdf } from './payslip.pdf.js';
import env from '../../../config/env.js';
import { resolveOwnershipScope } from '../../../common/utils/scope.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const listPayslips = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Payslips');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const filterEmployeeId = scope === 'own' ? employeeId : (queryParams.employee_id ? parseInt(queryParams.employee_id, 10) : undefined);

  const { rows, total } = await payrollModel.findPayslips({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    payrun_id: queryParams.payrun_id ? parseInt(queryParams.payrun_id, 10) : undefined,
    status: queryParams.status,
    limit: pageSize,
    offset,
  });

  return {
    data: rows,
    meta: {
      page,
      pageSize,
      total,
    },
  };
};

export const getPayslipById = async (id, user) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Payslips');
  const payslip = await payrollModel.findPayslipById(parseInt(id, 10), user.companyId);

  if (!payslip) {
    throw new AppError('Payslip not found', 404, 'NOT_FOUND');
  }

  if (scope === 'own' && payslip.employee_id !== employeeId) {
    throw new AppError('Access denied: You may only view your own payslips', 403, 'FORBIDDEN');
  }

  return payslip;
};

export const getOrGeneratePdf = async (id, user) => {
  const payslip = await getPayslipById(id, user);

  let pdfPath = payslip.pdf_file_path;
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    pdfPath = await generatePayslipPdf(payslip);
    await query('UPDATE payslips SET pdf_file_path = $1 WHERE id = $2', [pdfPath, payslip.id]);
  }

  return {
    filePath: pdfPath,
    filename: `payslip_${payslip.id}_${payslip.employee_code}.pdf`,
  };
};

export const sendEmail = async (id, user) => {
  const payslip = await getPayslipById(id, user);

  let pdfPath = payslip.pdf_file_path;
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    pdfPath = await generatePayslipPdf(payslip);
    await query('UPDATE payslips SET pdf_file_path = $1 WHERE id = $2', [pdfPath, payslip.id]);
  }

  const { sendPayslipEmail } = await import('./payslip.mailer.js');
  const mailResult = await sendPayslipEmail(payslip, pdfPath);
  await query('UPDATE payslips SET sent_at = CURRENT_TIMESTAMP WHERE id = $1', [payslip.id]);

  return {
    payslip_id: payslip.id,
    recipient: payslip.work_email,
    employee_name: `${payslip.employee_first_name || ''} ${payslip.employee_last_name || ''}`.trim(),
    success: mailResult.success,
    messageId: mailResult.messageId,
    previewUrl: mailResult.previewUrl || null,
    error: mailResult.error || null,
  };
};

export default {
  listPayslips,
  getPayslipById,
  getOrGeneratePdf,
  sendEmail,
};
