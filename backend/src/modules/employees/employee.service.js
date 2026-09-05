import employeeModel from './employee.model.js';
import env from '../../config/env.js';
import { resolveOwnershipScope } from '../../common/utils/scope.js';
import { EMPLOYEE_STATUSES } from '../../common/constants/enums.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listEmployees = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Employees');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  // Row-level self-scope enforcement: if Employee role, restrict strictly to their own ID
  const filterEmployeeId = scope === 'own' ? employeeId : (queryParams.employee_id || null);

  const isKanban = queryParams.group_by === 'status';

  const { rows, total } = await employeeModel.findAll({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    status: queryParams.status,
    department_id: queryParams.department_id ? parseInt(queryParams.department_id, 10) : undefined,
    employee_type: queryParams.employee_type,
    manager_id: queryParams.manager_id ? parseInt(queryParams.manager_id, 10) : undefined,
    search: queryParams.search,
    limit: isKanban ? undefined : pageSize,
    offset: isKanban ? undefined : offset,
  });

  if (isKanban) {
    const buckets = {};
    for (const status of EMPLOYEE_STATUSES) {
      buckets[status] = [];
    }
    for (const emp of rows) {
      if (buckets[emp.status]) {
        buckets[emp.status].push(emp);
      } else {
        buckets[emp.status] = [emp];
      }
    }
    return { data: buckets, meta: { total } };
  }

  return {
    data: rows,
    meta: {
      page,
      pageSize,
      total,
    },
  };
};

export const getEmployeeById = async (id, user) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Employees');
  const targetId = parseInt(id, 10);

  if (scope === 'own' && employeeId !== targetId) {
    throw new AppError('Access denied: You may only access your own employee profile', 403, 'FORBIDDEN');
  }

  const employee = await employeeModel.findById(targetId, user.companyId);
  if (!employee) {
    throw new AppError('Employee not found', 404, 'NOT_FOUND');
  }

  return employee;
};

export const createEmployee = async (user, data) => {
  return employeeModel.create(user.companyId, data);
};

export const updateEmployee = async (id, user, data) => {
  await getEmployeeById(id, user);
  return employeeModel.update(parseInt(id, 10), user.companyId, data);
};

export const deleteEmployee = async (id, user) => {
  await getEmployeeById(id, user);
  await employeeModel.remove(parseInt(id, 10), user.companyId);
  return true;
};

export default {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
