import contractModel from './contract.model.js';
import employeeModel from '../employees/employee.model.js';
import env from '../../config/env.js';
import { resolveOwnershipScope } from '../../common/utils/scope.js';
import { AppError } from '../../middleware/errorHandler.js';
import { withTransaction, query } from '../../config/db.js';

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

  if (!data.contract_number || data.contract_number.trim() === '') {
    const year = new Date().getFullYear();
    const countRes = await query(
      "SELECT COUNT(*) FROM contracts WHERE contract_number LIKE $1",
      [`CON/${year}/%`]
    );
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    data.contract_number = `CON/${year}/${String(seq).padStart(4, '0')}`;
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
  const contract = await getContractById(id, user);
  if (contract.status !== 'Draft') {
    throw new AppError('Only Draft contracts can be deleted', 400, 'BUSINESS_RULE_VIOLATION');
  }
  await contractModel.remove(parseInt(id, 10));
  return true;
};

export const activateContract = async (id, user) => {
  const contract = await getContractById(id, user);

  await withTransaction(async (client) => {
    // 1. Supersede any currently running contract for this employee to 'Expired'
    await client.query(
      `UPDATE contracts 
       SET status = 'Expired', updated_at = CURRENT_TIMESTAMP 
       WHERE employee_id = $1 AND status = 'Running' AND id != $2`,
      [contract.employee_id, contract.id]
    );

    // 2. Set this contract to 'Running'
    await client.query(
      `UPDATE contracts 
       SET status = 'Running', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [contract.id]
    );

    // 3. Back-sync to employee: department_id, job_position_id, working_schedule_id
    const updateFields = [];
    const values = [];
    let idx = 1;

    if (contract.department_id) {
      updateFields.push(`department_id = $${idx++}`);
      values.push(contract.department_id);
    }
    if (contract.job_position_id) {
      updateFields.push(`job_position_id = $${idx++}`);
      values.push(contract.job_position_id);
    }
    if (contract.working_schedule_id) {
      updateFields.push(`working_schedule_id = $${idx++}`);
      values.push(contract.working_schedule_id);
    }

    if (updateFields.length > 0) {
      values.push(contract.employee_id);
      await client.query(
        `UPDATE employees 
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $${idx}`,
        values
      );
    }
  });

  return contractModel.findById(contract.id, user.companyId);
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
  activateContract,
  resolveApplicableContract,
};
