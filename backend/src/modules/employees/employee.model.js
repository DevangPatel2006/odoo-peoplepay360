import { query } from '../../config/db.js';

export const findAll = async ({
  company_id,
  employee_id = null,
  status,
  department_id,
  employee_type,
  manager_id,
  search,
  limit,
  offset,
}) => {
  const conditions = ['e.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (employee_id) {
    conditions.push(`e.id = $${idx++}`);
    values.push(employee_id);
  }
  if (status) {
    conditions.push(`e.status = $${idx++}`);
    values.push(status);
  }
  if (department_id) {
    conditions.push(`e.department_id = $${idx++}`);
    values.push(department_id);
  }
  if (employee_type) {
    conditions.push(`e.employee_type = $${idx++}`);
    values.push(employee_type);
  }
  if (manager_id) {
    conditions.push(`e.manager_id = $${idx++}`);
    values.push(manager_id);
  }
  if (search) {
    conditions.push(`(
      e.first_name ILIKE $${idx} OR 
      e.last_name ILIKE $${idx} OR 
      e.employee_code ILIKE $${idx} OR 
      e.work_email ILIKE $${idx}
    )`);
    values.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM employees e WHERE ${whereClause}`;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT e.*,
           d.name AS department_name,
           jp.title AS job_position_title,
           m.first_name AS manager_first_name,
           m.last_name AS manager_last_name,
           ws.name AS working_schedule_name,
           c.contract_number AS active_contract_number,
           c.wage_per_month AS active_contract_wage
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN job_positions jp ON jp.id = e.job_position_id
    LEFT JOIN employees m ON m.id = e.manager_id
    LEFT JOIN working_schedules ws ON ws.id = e.working_schedule_id
    LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Running'
    WHERE ${whereClause}
    ORDER BY e.id ASC
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
    SELECT e.*,
           d.name AS department_name,
           jp.title AS job_position_title,
           m.first_name AS manager_first_name,
           m.last_name AS manager_last_name,
           ws.name AS working_schedule_name,
           c.id AS active_contract_id,
           c.contract_number AS active_contract_number,
           c.wage_per_month AS active_contract_wage
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN job_positions jp ON jp.id = e.job_position_id
    LEFT JOIN employees m ON m.id = e.manager_id
    LEFT JOIN working_schedules ws ON ws.id = e.working_schedule_id
    LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Running'
    WHERE e.id = $1 AND e.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const create = async (company_id, data) => {
  const fields = [
    'company_id',
    'employee_code',
    'first_name',
    'last_name',
    'work_email',
    'personal_phone',
    'department_id',
    'job_position_id',
    'manager_id',
    'working_schedule_id',
    'work_location',
    'employee_type',
    'status',
    'date_of_joining',
    'date_of_birth',
    'gender',
    'address',
    'bank_account_number',
    'bank_ifsc_or_swift',
    'bank_name',
    'photo_url',
  ];

  const values = [
    company_id,
    data.employee_code,
    data.first_name,
    data.last_name,
    data.work_email,
    data.personal_phone || null,
    data.department_id || null,
    data.job_position_id || null,
    data.manager_id || null,
    data.working_schedule_id || null,
    data.work_location || null,
    data.employee_type,
    data.status || 'Active',
    data.date_of_joining,
    data.date_of_birth || null,
    data.gender || null,
    data.address || null,
    data.bank_account_number || null,
    data.bank_ifsc_or_swift || null,
    data.bank_name || null,
    data.photo_url || null,
  ];

  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO employees (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

  const res = await query(sql, values);
  return res.rows[0];
};

export const update = async (id, company_id, data) => {
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
    return findById(id, company_id);
  }

  values.push(id, company_id);
  const sql = `
    UPDATE employees
    SET ${setClauses.join(', ')}
    WHERE id = $${idx++} AND company_id = $${idx++}
    RETURNING *
  `;

  const res = await query(sql, values);
  return res.rows[0];
};

export const remove = async (id, company_id) => {
  const res = await query('DELETE FROM employees WHERE id = $1 AND company_id = $2 RETURNING id', [id, company_id]);
  return res.rows[0] || null;
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
};
