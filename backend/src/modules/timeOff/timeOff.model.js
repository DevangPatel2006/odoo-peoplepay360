import { query } from '../../config/db.js';

/**
 * Time Off Types Queries
 */
export const findTypes = async (isActive = undefined) => {
  let sql = 'SELECT * FROM time_off_types';
  const params = [];
  if (isActive !== undefined) {
    sql += ' WHERE is_active = $1';
    params.push(isActive);
  }
  sql += ' ORDER BY id ASC';
  const res = await query(sql, params);
  return res.rows;
};

export const findTypeById = async (id) => {
  const res = await query('SELECT * FROM time_off_types WHERE id = $1', [id]);
  return res.rows[0] || null;
};

export const createType = async (data) => {
  const sql = `
    INSERT INTO time_off_types (
      name, unit, requires_allocation, approval_level, affects_payroll, display_color, is_active, configuration_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const res = await query(sql, [
    data.name,
    data.unit || 'Days',
    data.requires_allocation !== undefined ? data.requires_allocation : true,
    data.approval_level || 'Manager',
    data.affects_payroll !== undefined ? data.affects_payroll : true,
    data.display_color || '#3B82F6',
    data.is_active !== undefined ? data.is_active : true,
    data.configuration_notes || null,
  ]);
  return res.rows[0];
};

export const updateType = async (id, data) => {
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
    return findTypeById(id);
  }

  values.push(id);
  const sql = `UPDATE time_off_types SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const removeType = async (id) => {
  const res = await query('DELETE FROM time_off_types WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

/**
 * Time Off Allocations Queries
 */
export const findAllocations = async ({ company_id, employee_id, time_off_type_id, status, limit, offset }) => {
  const conditions = ['e.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (employee_id) {
    conditions.push(`a.employee_id = $${idx++}`);
    values.push(employee_id);
  }
  if (time_off_type_id) {
    conditions.push(`a.time_off_type_id = $${idx++}`);
    values.push(time_off_type_id);
  }
  if (status) {
    conditions.push(`a.status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) 
    FROM time_off_allocations a 
    JOIN employees e ON e.id = a.employee_id 
    WHERE ${whereClause}
  `;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT a.*,
           tot.name AS time_off_type_name,
           tot.unit AS time_off_unit,
           tot.display_color,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           app.first_name AS approver_first_name,
           app.last_name AS approver_last_name
    FROM time_off_allocations a
    JOIN employees e ON e.id = a.employee_id
    JOIN time_off_types tot ON tot.id = a.time_off_type_id
    LEFT JOIN employees app ON app.id = a.approver_id
    WHERE ${whereClause}
    ORDER BY a.id DESC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findAllocationById = async (id, company_id) => {
  const sql = `
    SELECT a.*,
           tot.name AS time_off_type_name,
           tot.unit AS time_off_unit,
           tot.display_color,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           app.first_name AS approver_first_name,
           app.last_name AS approver_last_name
    FROM time_off_allocations a
    JOIN employees e ON e.id = a.employee_id
    JOIN time_off_types tot ON tot.id = a.time_off_type_id
    LEFT JOIN employees app ON app.id = a.approver_id
    WHERE a.id = $1 AND e.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const createAllocation = async (data) => {
  const sql = `
    INSERT INTO time_off_allocations (
      employee_id, time_off_type_id, allocated_amount, taken_amount, status,
      approver_id, validity_start, validity_end, description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const res = await query(sql, [
    data.employee_id,
    data.time_off_type_id,
    data.allocated_amount,
    data.taken_amount || 0,
    data.status || 'Draft',
    data.approver_id || null,
    data.validity_start,
    data.validity_end,
    data.description || null,
  ]);
  return res.rows[0];
};

export const updateAllocation = async (id, data) => {
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    // remaining_amount is STORED generated column
    if (key !== 'remaining_amount' && value !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) {
    const res = await query('SELECT * FROM time_off_allocations WHERE id = $1', [id]);
    return res.rows[0];
  }

  values.push(id);
  const sql = `UPDATE time_off_allocations SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const removeAllocation = async (id) => {
  const res = await query('DELETE FROM time_off_allocations WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

/**
 * Time Off Requests Queries
 */
export const findRequests = async ({ company_id, employee_id, time_off_type_id, status, limit, offset }) => {
  const conditions = ['e.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (employee_id) {
    conditions.push(`r.employee_id = $${idx++}`);
    values.push(employee_id);
  }
  if (time_off_type_id) {
    conditions.push(`r.time_off_type_id = $${idx++}`);
    values.push(time_off_type_id);
  }
  if (status) {
    conditions.push(`r.status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) 
    FROM time_off_requests r 
    JOIN employees e ON e.id = r.employee_id 
    WHERE ${whereClause}
  `;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT r.*,
           tot.name AS time_off_type_name,
           tot.unit AS time_off_unit,
           tot.display_color,
           tot.requires_allocation,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           app.first_name AS approver_first_name,
           app.last_name AS approver_last_name
    FROM time_off_requests r
    JOIN employees e ON e.id = r.employee_id
    JOIN time_off_types tot ON tot.id = r.time_off_type_id
    LEFT JOIN employees app ON app.id = r.approver_id
    WHERE ${whereClause}
    ORDER BY r.id DESC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findRequestById = async (id, company_id) => {
  const sql = `
    SELECT r.*,
           tot.name AS time_off_type_name,
           tot.unit AS time_off_unit,
           tot.display_color,
           tot.requires_allocation,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           app.first_name AS approver_first_name,
           app.last_name AS approver_last_name
    FROM time_off_requests r
    JOIN employees e ON e.id = r.employee_id
    JOIN time_off_types tot ON tot.id = r.time_off_type_id
    LEFT JOIN employees app ON app.id = r.approver_id
    WHERE r.id = $1 AND e.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const createRequest = async (data) => {
  const sql = `
    INSERT INTO time_off_requests (
      employee_id, time_off_type_id, start_date, end_date, duration, status, approver_id, allocation_id, reason
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const res = await query(sql, [
    data.employee_id,
    data.time_off_type_id,
    data.start_date,
    data.end_date,
    data.duration,
    data.status || 'To Approve',
    data.approver_id || null,
    data.allocation_id || null,
    data.reason || null,
  ]);
  return res.rows[0];
};

export const updateRequest = async (id, data) => {
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
    const res = await query('SELECT * FROM time_off_requests WHERE id = $1', [id]);
    return res.rows[0];
  }

  values.push(id);
  const sql = `UPDATE time_off_requests SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const removeRequest = async (id) => {
  const res = await query('DELETE FROM time_off_requests WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

export default {
  findTypes,
  findTypeById,
  createType,
  updateType,
  removeType,
  findAllocations,
  findAllocationById,
  createAllocation,
  updateAllocation,
  removeAllocation,
  findRequests,
  findRequestById,
  createRequest,
  updateRequest,
  removeRequest,
};
