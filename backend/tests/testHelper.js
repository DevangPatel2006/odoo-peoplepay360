import request from 'supertest';
import app from '../src/app.js';
import { query, pool } from '../src/config/db.js';

export const getAuthToken = async (email = 'admin@peoplepay360.com', password = 'Password123!') => {
  // Ensure the requested user exists for testing purposes
  const check = await query('SELECT id FROM users WHERE LOWER(work_email) = LOWER($1)', [email]);
  if (check.rows.length === 0) {
    let roleName = 'Employee';
    if (email.includes('admin')) roleName = 'Admin';
    else if (email.includes('hrmanager')) roleName = 'HR Manager';
    else if (email.includes('payroll')) roleName = 'HR Payroll User';

    const empRes = await query(`
      INSERT INTO employees (
        company_id, employee_code, first_name, last_name, work_email,
        department_id, job_position_id, employee_type, status, date_of_joining
      ) VALUES (
        1, 'EMP-T-' || floor(random() * 89999 + 10000), 'Test', 'User', $1,
        1, 1, 'Full-time', 'Active', '2026-01-01'
      ) RETURNING id
    `, [email]);

    const userRes = await query(`
      INSERT INTO users (employee_id, work_email, password_hash, is_active)
      VALUES ($1, $2, '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true)
      RETURNING id
    `, [empRes.rows[0].id, email]);

    await query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT $1, id FROM roles WHERE name = $2
    `, [userRes.rows[0].id, roleName]);
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ work_email: email, password });

  if (!res.body || !res.body.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }

  return res.body.data.token;
};

export const closeDb = async () => {
  await pool.end();
};

export { app, query, request };
