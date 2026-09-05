import { query } from '../../config/db.js';

export const findAll = async ({
  company_id,
  employee_id,
  department_id,
  status,
  limit,
  offset,
}) => {
  const conditions = ['e.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (employee_id) {
    conditions.push(`c.employee_id = $${idx++}`);
    values.push(employee_id);
  }
  if (department_id) {
    conditions.push(`c.department_id = $${idx++}`);
    values.push(department_id);
  }
  if (status) {
    conditions.push(`c.status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) 
    FROM contracts c 
    JOIN employees e ON e.id = c.employee_id 
    WHERE ${whereClause}
  `;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT c.*,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           d.name AS department_name,
           jp.title AS job_position_title,
           ss.name AS salary_structure_name,
           ws.name AS working_schedule_name,
           (c.status = 'Running') AS is_active
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN departments d ON d.id = c.department_id
    LEFT JOIN job_positions jp ON jp.id = c.job_position_id
    LEFT JOIN salary_structures ss ON ss.id = c.salary_structure_id
    LEFT JOIN working_schedules ws ON ws.id = c.working_schedule_id
    WHERE ${whereClause}
    ORDER BY c.id DESC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findById = async (id, company_id) => {
  const sql = `
    SELECT c.*,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           d.name AS department_name,
           jp.title AS job_position_title,
           ss.name AS salary_structure_name,
           ws.name AS working_schedule_name,
           (c.status = 'Running') AS is_active
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    LEFT JOIN departments d ON d.id = c.department_id
    LEFT JOIN job_positions jp ON jp.id = c.job_position_id
    LEFT JOIN salary_structures ss ON ss.id = c.salary_structure_id
    LEFT JOIN working_schedules ws ON ws.id = c.working_schedule_id
    WHERE c.id = $1 AND e.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const create = async (data) => {
  const sql = `
    INSERT INTO contracts (
      contract_number, employee_id, department_id, job_position_id,
      working_schedule_id, salary_structure_id, wage_per_month,
      start_date, end_date, status, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const values = [
    data.contract_number,
    data.employee_id,
    data.department_id || null,
    data.job_position_id || null,
    data.working_schedule_id || null,
    data.salary_structure_id || null,
    data.wage_per_month,
    data.start_date,
    data.end_date || null,
    data.status || 'Draft',
    data.notes || null,
  ];

  const res = await query(sql, values);
  return res.rows[0];
};

export const update = async (id, data) => {
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) {
    const res = await query('SELECT * FROM contracts WHERE id = $1', [id]);
    return res.rows[0];
  }

  values.push(id);
  const sql = `
    UPDATE contracts
    SET ${setClauses.join(', ')}
    WHERE id = $${idx++}
    RETURNING *
  `;

  const res = await query(sql, values);
  return res.rows[0];
};

export const remove = async (id) => {
  const res = await query('DELETE FROM contracts WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

export const getApplicableContract = async (employeeId, periodStart, periodEnd) => {
  const sql = 'SELECT get_applicable_contract($1, $2, $3) AS contract_id';
  const res = await query(sql, [employeeId, periodStart, periodEnd]);
  return res.rows[0]?.contract_id;
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
  getApplicableContract,
};
