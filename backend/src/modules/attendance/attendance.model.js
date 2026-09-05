import { query } from '../../config/db.js';

export const findAll = async ({
  company_id,
  employee_id,
  start_date,
  end_date,
  status,
  limit,
  offset,
}) => {
  const conditions = ['e.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (employee_id) {
    conditions.push(`a.employee_id = $${idx++}`);
    values.push(employee_id);
  }
  if (start_date) {
    conditions.push(`a.attendance_date >= $${idx++}`);
    values.push(start_date);
  }
  if (end_date) {
    conditions.push(`a.attendance_date <= $${idx++}`);
    values.push(end_date);
  }
  if (status) {
    conditions.push(`a.status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) 
    FROM attendances a 
    JOIN employees e ON e.id = a.employee_id 
    WHERE ${whereClause}
  `;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT a.*,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           d.name AS department_name,
           u.work_email AS corrected_by_email
    FROM attendances a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN users u ON u.id = a.corrected_by_user_id
    WHERE ${whereClause}
    ORDER BY a.attendance_date DESC, a.id DESC
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
    SELECT a.*,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           d.name AS department_name,
           u.work_email AS corrected_by_email
    FROM attendances a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN users u ON u.id = a.corrected_by_user_id
    WHERE a.id = $1 AND e.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const findByEmployeeAndDate = async (employeeId, date) => {
  const sql = 'SELECT * FROM attendances WHERE employee_id = $1 AND attendance_date = $2';
  const res = await query(sql, [employeeId, date]);
  return res.rows[0] || null;
};

export const create = async (data) => {
  const sql = `
    INSERT INTO attendances (
      employee_id, attendance_date, check_in_at, check_out_at,
      overtime_hours, status, is_manual_correction, corrected_by_user_id, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const values = [
    data.employee_id,
    data.attendance_date,
    data.check_in_at || null,
    data.check_out_at || null,
    data.overtime_hours || 0,
    data.status || 'Present',
    data.is_manual_correction || false,
    data.corrected_by_user_id || null,
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
    // Never allow updating worked_hours directly (it is a STORED generated column)
    if (key !== 'worked_hours' && value !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) {
    const res = await query('SELECT * FROM attendances WHERE id = $1', [id]);
    return res.rows[0];
  }

  values.push(id);
  const sql = `
    UPDATE attendances
    SET ${setClauses.join(', ')}
    WHERE id = $${idx++}
    RETURNING *
  `;

  const res = await query(sql, values);
  return res.rows[0];
};

export const remove = async (id) => {
  const res = await query('DELETE FROM attendances WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

export default {
  findAll,
  findById,
  findByEmployeeAndDate,
  create,
  update,
  remove,
};
