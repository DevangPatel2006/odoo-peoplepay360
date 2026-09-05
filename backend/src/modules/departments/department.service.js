import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listDepartments = async (companyId) => {
  const result = await query(
    `SELECT d.*, 
            p.name AS parent_department_name,
            e.first_name AS manager_first_name,
            e.last_name AS manager_last_name,
            (SELECT COUNT(*) FROM employees emp WHERE emp.department_id = d.id AND emp.status = 'Active') AS active_employee_count
     FROM departments d
     LEFT JOIN departments p ON p.id = d.parent_department_id
     LEFT JOIN employees e ON e.id = d.manager_employee_id
     WHERE d.company_id = $1
     ORDER BY d.id ASC`,
    [companyId]
  );
  return result.rows;
};

export const getDepartmentById = async (id, companyId) => {
  const result = await query(
    `SELECT d.*, 
            p.name AS parent_department_name,
            e.first_name AS manager_first_name,
            e.last_name AS manager_last_name
     FROM departments d
     LEFT JOIN departments p ON p.id = d.parent_department_id
     LEFT JOIN employees e ON e.id = d.manager_employee_id
     WHERE d.id = $1 AND d.company_id = $2`,
    [id, companyId]
  );
  const dept = result.rows[0];
  if (!dept) {
    throw new AppError('Department not found', 404, 'NOT_FOUND');
  }
  return dept;
};

export const createDepartment = async (companyId, data) => {
  const result = await query(
    `INSERT INTO departments (company_id, name, parent_department_id, manager_employee_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [companyId, data.name, data.parent_department_id || null, data.manager_employee_id || null]
  );
  return result.rows[0];
};

export const updateDepartment = async (id, companyId, data) => {
  await getDepartmentById(id, companyId);

  const setClauses = [];
  const values = [];
  let idx = 1;

  if (data.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.parent_department_id !== undefined) {
    setClauses.push(`parent_department_id = $${idx++}`);
    values.push(data.parent_department_id);
  }
  if (data.manager_employee_id !== undefined) {
    setClauses.push(`manager_employee_id = $${idx++}`);
    values.push(data.manager_employee_id);
  }

  if (setClauses.length === 0) {
    return getDepartmentById(id, companyId);
  }

  values.push(id, companyId);
  const sql = `
    UPDATE departments 
    SET ${setClauses.join(', ')} 
    WHERE id = $${idx++} AND company_id = $${idx++} 
    RETURNING *
  `;
  const result = await query(sql, values);
  return result.rows[0];
};

export const deleteDepartment = async (id, companyId) => {
  await getDepartmentById(id, companyId);
  await query('DELETE FROM departments WHERE id = $1 AND company_id = $2', [id, companyId]);
  return true;
};

export default {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
