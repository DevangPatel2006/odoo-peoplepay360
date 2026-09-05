import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';
import env from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';

export const login = async ({ work_email, password }) => {
  const userResult = await query(
    'SELECT * FROM users WHERE LOWER(work_email) = LOWER($1)',
    [work_email]
  );

  const user = userResult.rows[0];
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.is_active) {
    throw new AppError('Account is disabled. Contact your administrator.', 403, 'ACCOUNT_INACTIVE');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Fetch roles
  const rolesResult = await query(
    `SELECT r.name 
     FROM roles r 
     JOIN user_roles ur ON ur.role_id = r.id 
     WHERE ur.user_id = $1`,
    [user.id]
  );
  const roles = rolesResult.rows.map((r) => r.name);

  // Fetch linked employee and company info
  let employeeId = user.employee_id || null;
  let companyId = 1;
  let employeeData = null;

  if (employeeId) {
    const empResult = await query(
      `SELECT id, company_id, employee_code, first_name, last_name, department_id, job_position_id, status 
       FROM employees 
       WHERE id = $1`,
      [employeeId]
    );
    if (empResult.rows.length > 0) {
      employeeData = empResult.rows[0];
      companyId = employeeData.company_id;
    }
  }

  // Update last login timestamp
  await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Sign JWT matching auth.middleware expectations:
  // decoded = { sub, employee_id, company_id, roles }
  const tokenPayload = {
    sub: user.id,
    employee_id: employeeId,
    company_id: companyId,
    roles,
  };

  const token = jwt.sign(tokenPayload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

  return {
    user: {
      id: user.id,
      work_email: user.work_email,
      employee_id: employeeId,
      company_id: companyId,
      roles,
      employee: employeeData,
    },
    token,
  };
};

export const getMe = async (userId) => {
  const userResult = await query(
    'SELECT id, employee_id, work_email, is_active, last_login_at, created_at FROM users WHERE id = $1',
    [userId]
  );

  const user = userResult.rows[0];
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const rolesResult = await query(
    `SELECT r.id, r.name, r.description 
     FROM roles r 
     JOIN user_roles ur ON ur.role_id = r.id 
     WHERE ur.user_id = $1`,
    [user.id]
  );

  let employee = null;
  if (user.employee_id) {
    const empResult = await query(
      `SELECT e.*, d.name AS department_name, jp.title AS job_position_title 
       FROM employees e 
       LEFT JOIN departments d ON d.id = e.department_id 
       LEFT JOIN job_positions jp ON jp.id = e.job_position_id 
       WHERE e.id = $1`,
      [user.employee_id]
    );
    employee = empResult.rows[0] || null;
  }

  return {
    ...user,
    roles: rolesResult.rows.map((r) => r.name),
    role_details: rolesResult.rows,
    employee,
  };
};

export const changePassword = async (userId, { old_password, new_password }) => {
  const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const isMatch = await bcrypt.compare(old_password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Current password does not match', 400, 'INVALID_PASSWORD');
  }

  const newHash = await bcrypt.hash(new_password, env.security.saltRounds);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

  return true;
};

export default {
  login,
  getMe,
  changePassword,
};
