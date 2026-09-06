import path from 'path';
import payslipService from './payslip.service.js';
import { ok } from '../../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await payslipService.listPayslips(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const payslip = await payslipService.getPayslipById(req.params.id, req.user);
  return ok(res, payslip);
};

export const getPdf = async (req, res) => {
  const { filePath, filename } = await payslipService.getOrGeneratePdf(req.params.id, req.user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.sendFile(path.resolve(filePath));
};

export const sendEmail = async (req, res) => {
  const result = await payslipService.sendEmail(req.params.id, req.user);
  return ok(res, result);
};

export default {
  list,
  getById,
  getPdf,
  sendEmail,
};
