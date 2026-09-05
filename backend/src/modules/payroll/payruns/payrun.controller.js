import payrunService from './payrun.service.js';
import payrollModel from '../payroll.model.js';
import { ok } from '../../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await payrunService.listPayruns(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const payrun = await payrunService.getPayrunById(req.params.id, req.user);
  return ok(res, payrun);
};

export const preview = async (req, res) => {
  const result = await payrunService.previewEligibleEmployees(req.user, req.body);
  return ok(res, result.eligible, { ...result.counts, skipped: result.skipped, warnings: result.warnings });
};

export const create = async (req, res) => {
  const result = await payrunService.createPayrun(req.user, req.body);
  return ok(res, result, undefined, 201);
};

export const compute = async (req, res) => {
  const payrun = await payrunService.computePayrun(req.params.id, req.user);
  return ok(res, payrun);
};

export const validateAction = async (req, res) => {
  const payrun = await payrunService.validatePayrun(req.params.id, req.user, req.body);
  return ok(res, payrun);
};

export const markPaid = async (req, res) => {
  const payrun = await payrunService.markPaidPayrun(req.params.id, req.user);
  return ok(res, payrun);
};

export const sendPayslips = async (req, res) => {
  const result = await payrunService.sendPayrunPayslips(req.params.id, req.user);
  return ok(res, result);
};

export const getWarnings = async (req, res) => {
  const warnings = await payrollModel.findWarningsByPayrun(req.params.id);
  return ok(res, warnings);
};

export const archive = async (req, res) => {
  const payrun = await payrunService.archivePayrun(req.params.id, req.user);
  return ok(res, payrun);
};

export const unarchive = async (req, res) => {
  const payrun = await payrunService.unarchivePayrun(req.params.id, req.user);
  return ok(res, payrun);
};

export default {
  list,
  getById,
  preview,
  create,
  compute,
  validateAction,
  markPaid,
  archive,
  unarchive,
  sendPayslips,
  getWarnings,
};
