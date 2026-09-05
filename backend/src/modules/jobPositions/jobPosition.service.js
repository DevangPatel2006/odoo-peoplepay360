import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listJobPositions = async (companyId, departmentId = null) => {
  let sql = `
    SELECT jp.*, d.name AS department_name,
           (SELECT COUNT(*) FROM employees emp WHERE emp.job_position_id = jp.id AND emp.status = 'Active') AS active_employee_count
    FROM job_positions jp
    JOIN departments d ON d.id = jp.department_id
    WHERE jp.company_id = $1
  `;
  const params = [companyId];

  if (departmentId) {
    sql += ' AND jp.department_id = $2';
    params.push(departmentId);
  }

  sql += ' ORDER BY jp.id ASC';

  const result = await query(sql, params);
  return result.rows;
};

export const getJobPositionById = async (id, companyId) => {
  const result = await query(
    `SELECT jp.*, d.name AS department_name
     FROM job_positions jp
     JOIN departments d ON d.id = jp.department_id
     WHERE jp.id = $1 AND jp.company_id = $2`,
    [id, companyId]
  );
  const pos = result.rows[0];
  if (!pos) {
    throw new AppError('Job position not found', 404, 'NOT_FOUND');
  }
  return pos;
};

export const createJobPosition = async (companyId, data) => {
  const result = await query(
    `INSERT INTO job_positions (company_id, department_id, title)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [companyId, data.department_id, data.title]
  );
  return result.rows[0];
};

export const updateJobPosition = async (id, companyId, data) => {
  await getJobPositionById(id, companyId);

  const setClauses = [];
  const values = [];
  let idx = 1;

  if (data.department_id !== undefined) {
    setClauses.push(`department_id = $${idx++}`);
    values.push(data.department_id);
  }
  if (data.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    values.push(data.title);
  }

  if (setClauses.length === 0) {
    return getJobPositionById(id, companyId);
  }

  values.push(id, companyId);
  const sql = `
    UPDATE job_positions
    SET ${setClauses.join(', ')}
    WHERE id = $${idx++} AND company_id = $${idx++}
    RETURNING *
  `;
  const result = await query(sql, values);
  return result.rows[0];
};

export const deleteJobPosition = async (id, companyId) => {
  await getJobPositionById(id, companyId);
  await query('DELETE FROM job_positions WHERE id = $1 AND company_id = $2', [id, companyId]);
  return true;
};

export default {
  listJobPositions,
  getJobPositionById,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
};
