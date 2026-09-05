import payrollModel from '../payroll.model.js';
import env from '../../../config/env.js';
import { ok } from '../../../common/utils/apiResponse.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(req.query.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;

  const { rows, total } = await payrollModel.findStructures({
    company_id: req.user.companyId,
    is_active: isActive,
    limit: pageSize,
    offset,
  });

  return ok(res, rows, { page, pageSize, total });
};

export const getById = async (req, res) => {
  const structure = await payrollModel.findStructureById(req.params.id, req.user.companyId);
  if (!structure) {
    throw new AppError('Salary structure not found', 404, 'NOT_FOUND');
  }

  const rules = await payrollModel.findRulesByStructure(structure.id);
  return ok(res, {
    ...structure,
    rules,
  });
};

export const create = async (req, res) => {
  const structure = await payrollModel.createStructure(req.user.companyId, req.body);
  return ok(res, structure, undefined, 201);
};

export const update = async (req, res) => {
  const existing = await payrollModel.findStructureById(req.params.id, req.user.companyId);
  if (!existing) {
    throw new AppError('Salary structure not found', 404, 'NOT_FOUND');
  }

  const structure = await payrollModel.updateStructure(req.params.id, req.user.companyId, req.body);
  return ok(res, structure);
};

export const remove = async (req, res) => {
  const existing = await payrollModel.findStructureById(req.params.id, req.user.companyId);
  if (!existing) {
    throw new AppError('Salary structure not found', 404, 'NOT_FOUND');
  }

  await payrollModel.removeStructure(req.params.id, req.user.companyId);
  return ok(res, { message: 'Salary structure deleted successfully' });
};

export default {
  list,
  getById,
  create,
  update,
  remove,
};
