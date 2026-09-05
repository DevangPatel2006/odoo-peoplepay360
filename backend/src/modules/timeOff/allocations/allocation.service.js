import timeOffModel from '../timeOff.model.js';
import employeeModel from '../../employees/employee.model.js';
import env from '../../../config/env.js';
import { resolveOwnershipScope } from '../../../common/utils/scope.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const listAllocations = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'TimeOff');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const filterEmployeeId =
    scope === 'own'
      ? employeeId
      : queryParams.employee_id
      ? parseInt(queryParams.employee_id, 10)
      : undefined;

  const { rows, total } = await timeOffModel.findAllocations({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    time_off_type_id: queryParams.time_off_type_id
      ? parseInt(queryParams.time_off_type_id, 10)
      : undefined,
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

export const getAllocationById = async (id, user) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'TimeOff');
  const allocation = await timeOffModel.findAllocationById(
    parseInt(id, 10),
    user.companyId
  );

  if (!allocation) {
    throw new AppError('Allocation not found', 404, 'NOT_FOUND');
  }

  if (scope === 'own' && allocation.employee_id !== employeeId) {
    throw new AppError(
      'Access denied: You may only view your own allocations',
      403,
      'FORBIDDEN'
    );
  }

  return allocation;
};

export const createAllocation = async (user, data) => {
  const employee = await employeeModel.findById(data.employee_id, user.companyId);
  if (!employee) {
    throw new AppError('Target employee not found in your company', 404, 'NOT_FOUND');
  }

  const timeOffType = await timeOffModel.findTypeById(data.time_off_type_id);
  if (!timeOffType) {
    throw new AppError('Invalid time off type', 400, 'VALIDATION_ERROR');
  }

  const allocation = await timeOffModel.createAllocation(data);
  return timeOffModel.findAllocationById(allocation.id, user.companyId);
};

export const updateAllocation = async (id, user, data) => {
  await getAllocationById(id, user);

  // remaining_amount is a GENERATED ALWAYS STORED column in Postgres and must never be updated directly
  const sanitizeData = { ...data };
  delete sanitizeData.remaining_amount;

  await timeOffModel.updateAllocation(parseInt(id, 10), sanitizeData);
  return timeOffModel.findAllocationById(parseInt(id, 10), user.companyId);
};

export const approveAllocation = async (id, user) => {
  const allocation = await getAllocationById(id, user);

  if (allocation.status === 'Approved') {
    throw new AppError('Allocation is already approved', 400, 'ALREADY_APPROVED');
  }

  await timeOffModel.updateAllocation(parseInt(id, 10), {
    status: 'Approved',
    approver_id: user.employeeId || null,
  });

  return timeOffModel.findAllocationById(parseInt(id, 10), user.companyId);
};

export const refuseAllocation = async (id, user) => {
  await getAllocationById(id, user);

  await timeOffModel.updateAllocation(parseInt(id, 10), {
    status: 'Refused',
    approver_id: user.employeeId || null,
  });

  return timeOffModel.findAllocationById(parseInt(id, 10), user.companyId);
};

export const deleteAllocation = async (id, user) => {
  const allocation = await getAllocationById(id, user);

  // Check if taken_amount > 0 before deleting
  if (parseFloat(allocation.taken_amount || 0) > 0) {
    throw new AppError(
      'Cannot delete allocation that has already been drawn from by approved time off requests',
      422,
      'ALLOCATION_IN_USE'
    );
  }

  await timeOffModel.removeAllocation(parseInt(id, 10));
  return true;
};

export default {
  listAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  approveAllocation,
  refuseAllocation,
  deleteAllocation,
};
