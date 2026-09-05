import contractModel from './contract.model.js';
import employeeModel from '../employees/employee.model.js';
import env from '../../config/env.js';
import { resolveOwnershipScope } from '../../common/utils/scope.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listContracts = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Contracts');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const filterEmployeeId = scope === 'own' ? employeeId : (queryParams.employee_id ? parseInt(queryParams.employee_id, 10) : undefined);

  const { rows, total } = await contractModel.findAll({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    department_id: queryParams.department_id ? parseInt(queryParams.department_id, 10) : undefined,
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

export const getContractById = async (id, user) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Contracts');
  const contract = await contractModel.findById(parseInt(id, 10), user.companyId);

  if (!contract) {
    throw new AppError('Contract not found', 404, 'NOT_FOUND');
  }

  if (scope === 'own' && contract.employee_id !== employeeId) {
    throw new AppError('Access denied: You may only view your own contract', 403, 'FORBIDDEN');
  }

  return contract;
};

export const createContract = async (user, data) => {
  // Ensure target employee belongs to the same company
  const employee = await employeeModel.findById(data.employee_id, user.companyId);
  if (!employee) {
    throw new AppError('Target employee not found in your company', 404, 'NOT_FOUND');
  }

  try {
    const created = await contractModel.create(data);
    return contractModel.findById(created.id, user.companyId);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'idx_unique_running_contract') {
      throw new AppError('Employee already has a running contract', 409, 'CONFLICT');
    }
    throw err;
  }
};

export const updateContract = async (id, user, data) => {
  await getContractById(id, user);

  try {
    await contractModel.update(parseInt(id, 10), data);
    return contractModel.findById(parseInt(id, 10), user.companyId);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'idx_unique_running_contract') {
      throw new AppError('Employee already has a running contract', 409, 'CONFLICT');
    }
    throw err;
  }
};

export const deleteContract = async (id, user) => {
  await getContractById(id, user);
  await contractModel.remove(parseInt(id, 10));
  return true;
};

export const resolveApplicableContract = async (user, { employee_id, period_start, period_end }) => {
  const { scope, employeeId: userEmployeeId } = resolveOwnershipScope(user, 'Contracts');
  const targetEmployeeId = parseInt(employee_id, 10);

  if (scope === 'own' && targetEmployeeId !== userEmployeeId) {
    throw new AppError('Access denied: Cannot resolve contracts for other employees', 403, 'FORBIDDEN');
  }

  // Ensure employee belongs to company
  const employee = await employeeModel.findById(targetEmployeeId, user.companyId);
  if (!employee) {
    throw new AppError('Employee not found in your company', 404, 'NOT_FOUND');
  }

  // Call the SQL function get_applicable_contract
  const contractId = await contractModel.getApplicableContract(targetEmployeeId, period_start, period_end);
  const contract = await contractModel.findById(contractId, user.companyId);
  return contract;
};

export default {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  resolveApplicableContract,
};
