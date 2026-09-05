import payrollModel from '../payroll.model.js';
import { ok } from '../../../common/utils/apiResponse.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const listByStructure = async (req, res) => {
  const structureId = parseInt(req.params.structureId, 10);
  const structure = await payrollModel.findStructureById(structureId, req.user.companyId);
  if (!structure) {
    throw new AppError('Salary structure not found', 404, 'NOT_FOUND');
  }

  const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
  const rules = await payrollModel.findRulesByStructure(structureId, {
    category: req.query.category,
    is_active: isActive,
  });

  return ok(res, rules);
};

export const getById = async (req, res) => {
  const rule = await payrollModel.findRuleById(req.params.id);
  if (!rule) {
    throw new AppError('Salary rule not found', 404, 'NOT_FOUND');
  }

  const structure = await payrollModel.findStructureById(rule.salary_structure_id, req.user.companyId);
  if (!structure) {
    throw new AppError('Salary rule does not belong to your company', 403, 'FORBIDDEN');
  }

  return ok(res, rule);
};

export const create = async (req, res) => {
  const structureId = parseInt(req.params.structureId || req.body.salary_structure_id, 10);
  const structure = await payrollModel.findStructureById(structureId, req.user.companyId);
  if (!structure) {
    throw new AppError('Salary structure not found in your company', 404, 'NOT_FOUND');
  }

  const rule = await payrollModel.createRule({
    ...req.body,
    salary_structure_id: structureId,
  });
  return ok(res, rule, undefined, 201);
};

export const update = async (req, res) => {
  await getById(req, res);
  const rule = await payrollModel.updateRule(req.params.id, req.body);
  return ok(res, rule);
};

export const remove = async (req, res) => {
  await getById(req, res);
  await payrollModel.removeRule(req.params.id);
  return ok(res, { message: 'Salary rule deleted successfully' });
};

export default {
  listByStructure,
  getById,
  create,
  update,
  remove,
};
