import timeOffModel from '../timeOff.model.js';
import employeeModel from '../../employees/employee.model.js';
import env from '../../../config/env.js';
import { resolveOwnershipScope } from '../../../common/utils/scope.js';
import { ok } from '../../../common/utils/apiResponse.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const listAllocationsDirect = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'TimeOff');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const filterEmployeeId = scope === 'own' ? employeeId : (queryParams.employee_id ? parseInt(queryParams.employee_id, 10) : undefined);

  const { rows, total } = await timeOffModel.findAllocations({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    time_off_type_id: queryParams.time_off_type_id ? parseInt(queryParams.time_off_type_id, 10) : undefined,
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

export const list = async (req, res) => {
  const { data, meta } = await listAllocationsDirect(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const { scope, employeeId } = resolveOwnershipScope(req.user, 'TimeOff');
  const allocation = await timeOffModel.findAllocationById(parseInt(req.params.id, 10), req.user.companyId);

  if (!allocation) {
    throw new AppError('Allocation not found', 404, 'NOT_FOUND');
  }

  if (scope === 'own' && allocation.employee_id !== employeeId) {
    throw new AppError('Access denied: You may only view your own allocations', 403, 'FORBIDDEN');
  }

  return ok(res, allocation);
};

export const create = async (req, res) => {
  const employee = await employeeModel.findById(req.body.employee_id, req.user.companyId);
  if (!employee) {
    throw new AppError('Target employee not found in your company', 404, 'NOT_FOUND');
  }

  const allocation = await timeOffModel.createAllocation(req.body);
  const fullAllocation = await timeOffModel.findAllocationById(allocation.id, req.user.companyId);
  return ok(res, fullAllocation, undefined, 201);
};

export const update = async (req, res) => {
  await getById(req, res);
  await timeOffModel.updateAllocation(parseInt(req.params.id, 10), req.body);
  const updated = await timeOffModel.findAllocationById(parseInt(req.params.id, 10), req.user.companyId);
  return ok(res, updated);
};

export const approve = async (req, res) => {
  const allocation = await timeOffModel.findAllocationById(parseInt(req.params.id, 10), req.user.companyId);
  if (!allocation) {
    throw new AppError('Allocation not found', 404, 'NOT_FOUND');
  }

  await timeOffModel.updateAllocation(parseInt(req.params.id, 10), {
    status: 'Approved',
    approver_id: req.user.employeeId || null,
  });

  const updated = await timeOffModel.findAllocationById(parseInt(req.params.id, 10), req.user.companyId);
  return ok(res, updated);
};

export const refuse = async (req, res) => {
  const allocation = await timeOffModel.findAllocationById(parseInt(req.params.id, 10), req.user.companyId);
  if (!allocation) {
    throw new AppError('Allocation not found', 404, 'NOT_FOUND');
  }

  await timeOffModel.updateAllocation(parseInt(req.params.id, 10), {
    status: 'Refused',
    approver_id: req.user.employeeId || null,
  });

  const updated = await timeOffModel.findAllocationById(parseInt(req.params.id, 10), req.user.companyId);
  return ok(res, updated);
};

export const remove = async (req, res) => {
  await getById(req, res);
  await timeOffModel.removeAllocation(parseInt(req.params.id, 10));
  return ok(res, { message: 'Allocation deleted successfully' });
};

export default {
  listAllocationsDirect,
  list,
  getById,
  create,
  update,
  approve,
  refuse,
  remove,
};
