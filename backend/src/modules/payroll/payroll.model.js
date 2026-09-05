import { query } from '../../config/db.js';

/**
 * Salary Structures Queries
 */
export const findStructures = async ({ company_id, is_active, limit, offset }) => {
  const conditions = ['ss.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (is_active !== undefined) {
    conditions.push(`ss.is_active = $${idx++}`);
    values.push(is_active);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM salary_structures ss WHERE ${whereClause}`;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT ss.*,
           (SELECT COUNT(*) FROM salary_rules sr WHERE sr.salary_structure_id = ss.id) AS rule_count,
           (SELECT COUNT(DISTINCT c.employee_id) 
            FROM contracts c 
            WHERE c.salary_structure_id = ss.id AND c.status = 'Running') AS active_employee_count
    FROM salary_structures ss
    WHERE ${whereClause}
    ORDER BY ss.id ASC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findStructureById = async (id, company_id) => {
  const sql = `
    SELECT ss.*,
           (SELECT COUNT(*) FROM salary_rules sr WHERE sr.salary_structure_id = ss.id) AS rule_count,
           (SELECT COUNT(DISTINCT c.employee_id) 
            FROM contracts c 
            WHERE c.salary_structure_id = ss.id AND c.status = 'Running') AS active_employee_count
    FROM salary_structures ss
    WHERE ss.id = $1 AND ss.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const createStructure = async (company_id, data) => {
  const sql = `
    INSERT INTO salary_structures (company_id, name, structure_type, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const res = await query(sql, [
    company_id,
    data.name,
    data.structure_type || 'Regular',
    data.is_active !== undefined ? data.is_active : true,
  ]);
  return res.rows[0];
};

export const updateStructure = async (id, company_id, data) => {
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
    return findStructureById(id, company_id);
  }

  values.push(id, company_id);
  const sql = `
    UPDATE salary_structures
    SET ${setClauses.join(', ')}
    WHERE id = $${idx++} AND company_id = $${idx++}
    RETURNING *
  `;
  const res = await query(sql, values);
  return res.rows[0];
};

export const removeStructure = async (id, company_id) => {
  const res = await query('DELETE FROM salary_structures WHERE id = $1 AND company_id = $2 RETURNING id', [
    id,
    company_id,
  ]);
  return res.rows[0] || null;
};

/**
 * Salary Rules Queries
 */
export const findRulesByStructure = async (structureId, { category, is_active } = {}) => {
  const conditions = ['sr.salary_structure_id = $1'];
  const values = [structureId];
  let idx = 2;

  if (category) {
    conditions.push(`sr.category = $${idx++}`);
    values.push(category);
  }
  if (is_active !== undefined) {
    conditions.push(`sr.is_active = $${idx++}`);
    values.push(is_active);
  }

  const sql = `
    SELECT sr.* 
    FROM salary_rules sr 
    WHERE ${conditions.join(' AND ')} 
    ORDER BY sr.sequence ASC
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const findRuleById = async (id) => {
  const res = await query('SELECT * FROM salary_rules WHERE id = $1', [id]);
  return res.rows[0] || null;
};

export const createRule = async (data) => {
  const sql = `
    INSERT INTO salary_rules (
      salary_structure_id, name, code, category, sequence, computation_method,
      fixed_amount, percentage_value, percentage_base, formula_expression, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const res = await query(sql, [
    data.salary_structure_id,
    data.name,
    data.code,
    data.category,
    data.sequence || 10,
    data.computation_method,
    data.fixed_amount !== undefined ? data.fixed_amount : null,
    data.percentage_value !== undefined ? data.percentage_value : null,
    data.percentage_base || null,
    data.formula_expression || null,
    data.is_active !== undefined ? data.is_active : true,
  ]);
  return res.rows[0];
};

export const updateRule = async (id, data) => {
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
    return findRuleById(id);
  }

  values.push(id);
  const sql = `UPDATE salary_rules SET ${setClauses.join(', ')} WHERE id = $${idx++} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const removeRule = async (id) => {
  const res = await query('DELETE FROM salary_rules WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

/**
 * Payruns Queries
 */
export const findPayruns = async ({ company_id, status, is_archived = false, search, limit, offset }) => {
  const conditions = ['pr.company_id = $1', 'pr.is_archived = $2'];
  const values = [company_id, is_archived];
  let idx = 3;

  if (status) {
    conditions.push(`pr.status = $${idx++}`);
    values.push(status);
  }
  if (search) {
    conditions.push(`pr.name ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM payruns pr WHERE ${whereClause}`;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT pr.*,
           ss.name AS salary_structure_name,
           u.work_email AS created_by_email,
           COUNT(DISTINCT pe.employee_id) AS total_employees_count,
           COUNT(DISTINCT p.id) AS total_payslips_count,
           COALESCE(SUM(p.gross_amount), 0.00) AS total_gross_amount,
           COALESCE(SUM(p.net_amount), 0.00) AS total_net_amount,
           (
             SELECT COUNT(*) 
             FROM payroll_warnings pw 
             JOIN payslips p2 ON p2.id = pw.payslip_id 
             WHERE p2.payrun_id = pr.id AND pw.is_resolved = false
           ) AS unresolved_warnings_count
    FROM payruns pr
    JOIN salary_structures ss ON ss.id = pr.salary_structure_id
    LEFT JOIN users u ON u.id = pr.created_by_user_id
    LEFT JOIN payrun_employees pe ON pe.payrun_id = pr.id
    LEFT JOIN payslips p ON p.payrun_id = pr.id
    WHERE ${whereClause}
    GROUP BY pr.id, ss.id, u.id
    ORDER BY pr.period_start DESC, pr.id DESC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findPayrunById = async (id, company_id) => {
  const sql = `
    SELECT pr.*,
           ss.name AS salary_structure_name,
           u.work_email AS created_by_email,
           COUNT(DISTINCT pe.employee_id) AS total_employees_count,
           COUNT(DISTINCT p.id) AS total_payslips_count,
           COALESCE(SUM(p.gross_amount), 0.00) AS total_gross_amount,
           COALESCE(SUM(p.net_amount), 0.00) AS total_net_amount,
           (
             SELECT COUNT(*) 
             FROM payroll_warnings pw 
             JOIN payslips p2 ON p2.id = pw.payslip_id 
             WHERE p2.payrun_id = pr.id AND pw.is_resolved = false
           ) AS unresolved_warnings_count
    FROM payruns pr
    JOIN salary_structures ss ON ss.id = pr.salary_structure_id
    LEFT JOIN users u ON u.id = pr.created_by_user_id
    LEFT JOIN payrun_employees pe ON pe.payrun_id = pr.id
    LEFT JOIN payslips p ON p.payrun_id = pr.id
    WHERE pr.id = $1 AND pr.company_id = $2
    GROUP BY pr.id, ss.id, u.id
  `;
  const res = await query(sql, [id, company_id]);
  return res.rows[0] || null;
};

export const findPayrunEmployees = async (payrunId) => {
  const sql = `
    SELECT pe.*,
           e.first_name, e.last_name, e.employee_code, e.work_email,
           d.name AS department_name,
           c.contract_number, c.wage_per_month
    FROM payrun_employees pe
    JOIN employees e ON e.id = pe.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    JOIN contracts c ON c.id = pe.resolved_contract_id
    WHERE pe.payrun_id = $1
    ORDER BY e.first_name ASC
  `;
  const res = await query(sql, [payrunId]);
  return res.rows;
};

export const findPayrunPayslips = async (payrunId) => {
  const sql = `
    SELECT p.*,
           e.first_name, e.last_name, e.employee_code, e.work_email,
           d.name AS department_name,
           (SELECT COUNT(*) FROM payroll_warnings pw WHERE pw.payslip_id = p.id AND pw.is_resolved = false) AS unresolved_warning_count
    FROM payslips p
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE p.payrun_id = $1
    ORDER BY e.first_name ASC
  `;
  const res = await query(sql, [payrunId]);
  return res.rows;
};

/**
 * Payslips Queries
 */
export const findPayslips = async ({ company_id, employee_id, payrun_id, status, limit, offset }) => {
  const conditions = ['pr.company_id = $1', 'p.is_archived = false'];
  const values = [company_id];
  let idx = 2;

  if (employee_id) {
    conditions.push(`p.employee_id = $${idx++}`);
    values.push(employee_id);
  }
  if (payrun_id) {
    conditions.push(`p.payrun_id = $${idx++}`);
    values.push(payrun_id);
  }
  if (status) {
    conditions.push(`p.status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) 
    FROM payslips p 
    JOIN payruns pr ON pr.id = p.payrun_id 
    WHERE ${whereClause}
  `;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT p.*,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           e.work_email,
           d.name AS department_name,
           pr.name AS payrun_name,
           ss.name AS salary_structure_name,
           c.contract_number,
           c.wage_per_month AS contract_wage,
           (SELECT COUNT(*) FROM payroll_warnings pw WHERE pw.payslip_id = p.id AND pw.is_resolved = false) AS unresolved_warning_count
    FROM payslips p
    JOIN payruns pr ON pr.id = p.payrun_id
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    JOIN salary_structures ss ON ss.id = p.salary_structure_id
    JOIN contracts c ON c.id = p.contract_id
    WHERE ${whereClause}
    ORDER BY p.id DESC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findPayslipById = async (id, company_id) => {
  const sql = `
    SELECT p.*,
           e.first_name AS employee_first_name,
           e.last_name AS employee_last_name,
           e.employee_code,
           e.work_email,
           e.bank_account_number,
           e.bank_name,
           e.bank_ifsc_or_swift,
           d.name AS department_name,
           jp.title AS job_position_title,
           pr.name AS payrun_name,
           ss.name AS salary_structure_name,
           c.contract_number,
           c.wage_per_month AS contract_wage
    FROM payslips p
    JOIN payruns pr ON pr.id = p.payrun_id
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN job_positions jp ON jp.id = e.job_position_id
    JOIN salary_structures ss ON ss.id = p.salary_structure_id
    JOIN contracts c ON c.id = p.contract_id
    WHERE p.id = $1 AND pr.company_id = $2
  `;
  const res = await query(sql, [id, company_id]);
  const payslip = res.rows[0];
  if (!payslip) return null;

  // Lines
  const linesRes = await query(
    'SELECT * FROM payslip_lines WHERE payslip_id = $1 ORDER BY sequence ASC',
    [id]
  );

  // Warnings
  const warningsRes = await query(
    'SELECT * FROM payroll_warnings WHERE payslip_id = $1 ORDER BY id ASC',
    [id]
  );

  return {
    ...payslip,
    lines: linesRes.rows,
    warnings: warningsRes.rows,
  };
};

export const findWarningsByPayrun = async (payrunId) => {
  const sql = `
    SELECT pw.*,
           p.employee_id,
           e.first_name, e.last_name, e.employee_code
    FROM payroll_warnings pw
    JOIN payslips p ON p.id = pw.payslip_id
    JOIN employees e ON e.id = p.employee_id
    WHERE p.payrun_id = $1
    ORDER BY pw.is_resolved ASC, pw.id DESC
  `;
  const res = await query(sql, [payrunId]);
  return res.rows;
};

export const resolveWarning = async (id) => {
  const sql = 'UPDATE payroll_warnings SET is_resolved = true WHERE id = $1 RETURNING *';
  const res = await query(sql, [id]);
  return res.rows[0] || null;
};

export default {
  findStructures,
  findStructureById,
  createStructure,
  updateStructure,
  removeStructure,
  findRulesByStructure,
  findRuleById,
  createRule,
  updateRule,
  removeRule,
  findPayruns,
  findPayrunById,
  findPayrunEmployees,
  findPayrunPayslips,
  findPayslips,
  findPayslipById,
  findWarningsByPayrun,
  resolveWarning,
};
