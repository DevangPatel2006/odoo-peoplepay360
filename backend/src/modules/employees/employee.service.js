import employeeModel from './employee.model.js';
import env from '../../config/env.js';
import { resolveOwnershipScope } from '../../common/utils/scope.js';
import { EMPLOYEE_STATUSES } from '../../common/constants/enums.js';
import { AppError } from '../../middleware/errorHandler.js';
import { withTransaction } from '../../config/db.js';
import { generateTemporaryPassword } from '../../common/utils/password.js';
import employeeMailer from './employee.mailer.js';
import ROLES from '../../common/constants/roles.js';
import bcrypt from 'bcrypt';

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
  const { role_ids, send_welcome_email = true, ...employeeFields } = data;

  const result = await withTransaction(async (client) => {
    // 1. Create the employee record inside the same transaction
    const employee = await employeeModel.createWithClient(client, user.companyId, employeeFields);

    // 2. Resolve which roles the new login account should have
    let resolvedRoleIds = role_ids;
    if (!resolvedRoleIds || resolvedRoleIds.length === 0) {
      const employeeRoleRes = await client.query('SELECT id FROM roles WHERE name = $1', [ROLES.EMPLOYEE]);
      resolvedRoleIds = employeeRoleRes.rows[0] ? [employeeRoleRes.rows[0].id] : [];
    }

    // 3. Generate + hash a temporary password
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, env.security.saltRounds);

    // 4. Create the linked login account inside the SAME transaction
    const userRow = await client.query(
      `INSERT INTO users (employee_id, work_email, password_hash, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, employee_id, work_email, is_active`,
      [employee.id, employee.work_email, passwordHash]
    );
    const newUser = userRow.rows[0];

    for (const roleId of resolvedRoleIds) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newUser.id, roleId]
      );
    }

    return { employee, account: newUser, temporaryPassword, sendWelcomeEmail: send_welcome_email };
  });

  // 5. Email is sent OUTSIDE the transaction
  let emailResult = { success: false, skipped: true };
  if (result.sendWelcomeEmail) {
    emailResult = await employeeMailer.sendWelcomeCredentialsEmail({
      work_email: result.employee.work_email,
      first_name: result.employee.first_name,
      temporary_password: result.temporaryPassword,
    });
  }

  // 6. Return temporary password to caller exactly once
  return {
    ...result.employee,
    account: { id: result.account.id, work_email: result.account.work_email },
    temporary_password: result.temporaryPassword,
    welcome_email: emailResult,
  };
};

export const resetCredentials = async (id, user) => {
  const employee = await getEmployeeById(id, user);

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, env.security.saltRounds);

  const account = await withTransaction(async (client) => {
    // Check if a user already exists for this employee or work_email
    const existingUserRes = await client.query(
      'SELECT id, employee_id, work_email FROM users WHERE employee_id = $1 OR LOWER(work_email) = LOWER($2)',
      [employee.id, employee.work_email]
    );

    let userRecord;
    if (existingUserRes.rows.length > 0) {
      userRecord = existingUserRes.rows[0];
      const updatedUserRes = await client.query(
        `UPDATE users 
         SET password_hash = $1, employee_id = $2, work_email = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, employee_id, work_email, is_active`,
        [passwordHash, employee.id, employee.work_email, userRecord.id]
      );
      userRecord = updatedUserRes.rows[0];
    } else {
      // Create user row if one doesn't exist yet for an older employee
      const newUserRes = await client.query(
        `INSERT INTO users (employee_id, work_email, password_hash, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id, employee_id, work_email, is_active`,
        [employee.id, employee.work_email, passwordHash]
      );
      userRecord = newUserRes.rows[0];

      // Assign default Employee role
      const employeeRoleRes = await client.query('SELECT id FROM roles WHERE name = $1', [ROLES.EMPLOYEE]);
      if (employeeRoleRes.rows[0]) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userRecord.id, employeeRoleRes.rows[0].id]
        );
      }
    }

    return userRecord;
  });

  const emailResult = await employeeMailer.sendWelcomeCredentialsEmail({
    work_email: employee.work_email,
    first_name: employee.first_name,
    temporary_password: temporaryPassword,
  });

  return {
    ...employee,
    account: { id: account.id, work_email: account.work_email },
    temporary_password: temporaryPassword,
    welcome_email: emailResult,
  };
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
  resetCredentials,
  updateEmployee,
  deleteEmployee,
};
