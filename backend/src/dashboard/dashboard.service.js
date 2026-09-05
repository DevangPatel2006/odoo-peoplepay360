import { query } from '../config/db.js';

export const getKpis = async (companyId, { period_start, period_end, department_id, employee_type } = {}) => {
  // If no filters are provided, query directly from the live view
  if (!period_start && !period_end && !department_id && !employee_type) {
    const res = await query('SELECT * FROM v_kpi_summary WHERE company_id = $1', [companyId]);
    return res.rows[0] || null;
  }

  // If parameters are provided, dynamically extend predicates over the base underlying tables
  const conditions = ['c.id = $1'];
  const values = [companyId];
  let idx = 2;

  if (period_start) {
    conditions.push(`p.period_start >= $${idx++}`);
    values.push(period_start);
  }
  if (period_end) {
    conditions.push(`p.period_end <= $${idx++}`);
    values.push(period_end);
  }
  if (department_id) {
    conditions.push(`e.department_id = $${idx++}`);
    values.push(department_id);
  }
  if (employee_type) {
    conditions.push(`e.employee_type = $${idx++}`);
    values.push(employee_type);
  }

  const sql = `
    SELECT 
        c.id AS company_id,
        c.name AS company_name,
        COALESCE(SUM(p.net_amount), 0.00) AS total_net_salary_paid,
        COUNT(p.id) AS total_payslips_generated,
        COUNT(CASE WHEN p.status = 'Paid' THEN 1 END) AS paid_payslips_count,
        COUNT(CASE WHEN p.status IN ('Draft', 'Computed', 'Done') THEN 1 END) AS pending_payslips_count,
        COALESCE(ROUND(AVG(p.net_amount), 2), 0.00) AS average_salary_per_employee,
        (
            SELECT COALESCE(SUM(tr.duration), 0.00) 
            FROM time_off_requests tr 
            JOIN employees e2 ON tr.employee_id = e2.id 
            WHERE e2.company_id = c.id AND tr.status = 'Approved'
        ) AS total_approved_time_off_days,
        (
            SELECT COALESCE(ROUND(
                (COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 2
            ), 0.00)
            FROM attendances a
            JOIN employees e3 ON a.employee_id = e3.id
            WHERE e3.company_id = c.id
        ) AS attendance_health_percentage
    FROM companies c
    LEFT JOIN payruns pr ON pr.company_id = c.id
    LEFT JOIN payslips p ON p.payrun_id = pr.id
    LEFT JOIN employees e ON e.id = p.employee_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY c.id, c.name;
  `;

  const res = await query(sql, values);
  return res.rows[0] || null;
};

export const getSalaryCostByDepartment = async (companyId, { period_start, period_end, department_id, employee_type } = {}) => {
  const conditions = ['d.company_id = $1', "pr.status IN ('Validated', 'Paid')", "p.status IN ('Done', 'Paid')"];
  const values = [companyId];
  let idx = 2;

  if (department_id) {
    conditions.push(`d.id = $${idx++}`);
    values.push(parseInt(department_id, 10));
  }
  if (employee_type) {
    conditions.push(`e.employee_type = $${idx++}`);
    values.push(employee_type);
  }
  if (period_start) {
    conditions.push(`p.period_start >= $${idx++}`);
    values.push(period_start);
  }
  if (period_end) {
    conditions.push(`p.period_end <= $${idx++}`);
    values.push(period_end);
  }

  const sql = `
    SELECT 
        d.id AS department_id,
        d.name AS department_name,
        d.company_id,
        COUNT(p.id) AS employee_count,
        COALESCE(SUM(p.basic_amount), 0.00) AS total_basic_amount,
        COALESCE(SUM(p.gross_amount), 0.00) AS total_gross_amount,
        COALESCE(SUM(p.net_amount), 0.00) AS total_net_amount
    FROM departments d
    JOIN employees e ON e.department_id = d.id
    JOIN payslips p ON p.employee_id = e.id
    JOIN payruns pr ON pr.id = p.payrun_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY d.id, d.name, d.company_id
    ORDER BY total_net_amount DESC
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const getMonthlyTrend = async (companyId, { period_start, period_end, department_id, employee_type } = {}) => {
  const conditions = ['pr.company_id = $1', 'pr.is_archived = false', "pr.status IN ('Validated', 'Paid')", "p.status IN ('Done', 'Paid')"];
  const values = [companyId];
  let idx = 2;

  if (department_id) {
    conditions.push(`e.department_id = $${idx++}`);
    values.push(parseInt(department_id, 10));
  }
  if (employee_type) {
    conditions.push(`e.employee_type = $${idx++}`);
    values.push(employee_type);
  }
  if (period_start) {
    conditions.push(`p.period_start >= $${idx++}`);
    values.push(period_start);
  }
  if (period_end) {
    conditions.push(`p.period_end <= $${idx++}`);
    values.push(period_end);
  }

  const sql = `
    SELECT 
        pr.company_id,
        TO_CHAR(p.period_start, 'YYYY-MM') AS pay_month,
        COUNT(DISTINCT p.id) AS payslips_count,
        COALESCE(SUM(p.gross_amount), 0.00) AS total_gross_salary,
        COALESCE(SUM(p.net_amount), 0.00) AS total_net_salary
    FROM payruns pr
    JOIN payslips p ON p.payrun_id = pr.id
    JOIN employees e ON e.id = p.employee_id
    WHERE ${conditions.join(' AND ')}
    GROUP BY pr.company_id, TO_CHAR(p.period_start, 'YYYY-MM')
    ORDER BY pay_month ASC
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const getAttendanceOverview = async (companyId, { period_start, period_end, department_id, employee_type } = {}) => {
  const conditions = ['e.company_id = $1'];
  const values = [companyId];
  let idx = 2;

  if (department_id) {
    conditions.push(`e.department_id = $${idx++}`);
    values.push(parseInt(department_id, 10));
  }
  if (employee_type) {
    conditions.push(`e.employee_type = $${idx++}`);
    values.push(employee_type);
  }
  if (period_start) {
    conditions.push(`a.attendance_date >= $${idx++}`);
    values.push(period_start);
  }
  if (period_end) {
    conditions.push(`a.attendance_date <= $${idx++}`);
    values.push(period_end);
  }

  const sql = `
    SELECT 
        e.company_id,
        e.department_id,
        d.name AS department_name,
        COUNT(a.id) AS total_attendance_records,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_count,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END) AS late_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent_count,
        COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) AS on_leave_count,
        COUNT(CASE WHEN a.is_manual_correction THEN 1 END) AS manual_corrections_count,
        COALESCE(SUM(a.worked_hours), 0.00) AS total_worked_hours,
        COALESCE(SUM(a.overtime_hours), 0.00) AS total_overtime_hours,
        ROUND(
            (COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 2
        ) AS coverage_percentage
    FROM attendances a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY e.company_id, e.department_id, d.name
    ORDER BY d.name ASC NULLS LAST
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const getTimeOffOverview = async (companyId = 1, { period_start, period_end, department_id, employee_type } = {}) => {
  const sql = 'SELECT * FROM v_time_off_overview WHERE company_id = $1 ORDER BY time_off_type_name ASC';
  const res = await query(sql, [companyId]);
  return res.rows;
};

export const getDepartmentOverview = async (companyId, { department_id, employee_type } = {}) => {
  const conditions = ['d.company_id = $1'];
  const values = [companyId];
  let idx = 2;

  if (department_id) {
    conditions.push(`d.id = $${idx++}`);
    values.push(parseInt(department_id, 10));
  }
  if (employee_type) {
    conditions.push(`e.employee_type = $${idx++}`);
    values.push(employee_type);
  }

  const sql = `
    SELECT d.id AS department_id,
           d.name AS department_name,
           c.name AS company_name,
           COUNT(DISTINCT e.id) AS headcount,
           COALESCE(SUM(cnt.wage_per_month), 0.00) AS total_monthly_committed_salary
    FROM departments d
    JOIN companies c ON d.company_id = c.id
    LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'Active'
    LEFT JOIN contracts cnt ON cnt.employee_id = e.id AND cnt.status = 'Running'
    WHERE ${conditions.join(' AND ')}
    GROUP BY d.id, d.name, c.name
    ORDER BY headcount DESC
  `;
  const res = await query(sql, values);
  return res.rows;
};

export const getAlerts = async (companyId) => {
  const warningsSql = `
    SELECT pw.*,
           p.payrun_id,
           pr.name AS payrun_name,
           p.employee_id,
           e.first_name, e.last_name, e.employee_code
    FROM payroll_warnings pw
    JOIN payslips p ON p.id = pw.payslip_id
    JOIN payruns pr ON pr.id = p.payrun_id
    JOIN employees e ON e.id = p.employee_id
    WHERE pr.company_id = $1 AND pw.is_resolved = false
    ORDER BY pw.id DESC
  `;
  const warningsRes = await query(warningsSql, [companyId]);

  const statusSql = `
    SELECT psa.*, pr.name AS payrun_name
    FROM v_payslip_status_and_alerts psa
    JOIN payruns pr ON pr.id = psa.payrun_id
    WHERE pr.company_id = $1
  `;
  const statusRes = await query(statusSql, [companyId]);

  return {
    unresolved_warnings: warningsRes.rows,
    payslip_status_alerts: statusRes.rows,
  };
};

export const getDashboardSummary = async (companyId, queryParams = {}) => {
  const deptId = queryParams.department_id ? parseInt(queryParams.department_id, 10) : null;
  const empType = queryParams.employee_type || null;

  const empCountConditions = ['company_id = $1', "status = 'Active'"];
  const empCountValues = [companyId];
  let empIdx = 2;
  if (deptId) { empCountConditions.push(`department_id = $${empIdx++}`); empCountValues.push(deptId); }
  if (empType) { empCountConditions.push(`employee_type = $${empIdx++}`); empCountValues.push(empType); }

  const empCountPromise = query(`SELECT COUNT(*)::int AS count FROM employees WHERE ${empCountConditions.join(' AND ')}`, empCountValues);

  const contractCountConditions = ['e.company_id = $1', "c.status = 'Running'"];
  const contractCountValues = [companyId];
  let cntIdx = 2;
  if (deptId) { contractCountConditions.push(`e.department_id = $${cntIdx++}`); contractCountValues.push(deptId); }
  if (empType) { contractCountConditions.push(`e.employee_type = $${cntIdx++}`); contractCountValues.push(empType); }

  const contractCountPromise = query(`SELECT COUNT(*)::int AS count FROM contracts c JOIN employees e ON e.id = c.employee_id WHERE ${contractCountConditions.join(' AND ')}`, contractCountValues);

  const attendanceExceptionsPromise = deptId
    ? query("SELECT COUNT(*)::int AS count FROM attendances a JOIN employees e ON e.id = a.employee_id WHERE e.company_id = $1 AND (a.check_out_at IS NULL OR a.status IN ('Disputed', 'Late')) AND e.department_id = $2", [companyId, deptId])
    : query("SELECT COUNT(*)::int AS count FROM attendances a JOIN employees e ON e.id = a.employee_id WHERE e.company_id = $1 AND (a.check_out_at IS NULL OR a.status IN ('Disputed', 'Late'))", [companyId]);

  const pendingLeavesPromise = deptId
    ? query("SELECT COUNT(*)::int AS count FROM time_off_requests tr JOIN employees e ON e.id = tr.employee_id WHERE e.company_id = $1 AND tr.status = 'To Approve' AND e.department_id = $2", [companyId, deptId])
    : query("SELECT COUNT(*)::int AS count FROM time_off_requests tr JOIN employees e ON e.id = tr.employee_id WHERE e.company_id = $1 AND tr.status = 'To Approve'", [companyId]);

  const recentLeavesPromise = deptId
    ? query(`
        SELECT tr.id, tr.status, tr.duration, tr.start_date, tr.end_date,
               tot.name AS time_off_type_name,
               e.first_name, e.last_name
        FROM time_off_requests tr
        JOIN employees e ON e.id = tr.employee_id
        JOIN time_off_types tot ON tot.id = tr.time_off_type_id
        WHERE e.company_id = $1 AND e.department_id = $2
        ORDER BY tr.created_at DESC
        LIMIT 5
      `, [companyId, deptId])
    : query(`
        SELECT tr.id, tr.status, tr.duration, tr.start_date, tr.end_date,
               tot.name AS time_off_type_name,
               e.first_name, e.last_name
        FROM time_off_requests tr
        JOIN employees e ON e.id = tr.employee_id
        JOIN time_off_types tot ON tot.id = tr.time_off_type_id
        WHERE e.company_id = $1
        ORDER BY tr.created_at DESC
        LIMIT 5
      `, [companyId]);

  const [
    kpis,
    alerts,
    salaryCost,
    attendance,
    timeOff,
    departmentOverview,
    monthlyTrend,
    empCountRes,
    contractCountRes,
    attendanceExceptionsRes,
    pendingLeavesRes,
    recentLeavesRes,
  ] = await Promise.all([
    getKpis(companyId, queryParams).catch(() => null),
    getAlerts(companyId).catch(() => ({ unresolved_warnings: [], payslip_status_alerts: [] })),
    getSalaryCostByDepartment(companyId, queryParams).catch(() => []),
    getAttendanceOverview(companyId, queryParams).catch(() => []),
    getTimeOffOverview(companyId, queryParams).catch(() => []),
    getDepartmentOverview(companyId, queryParams).catch(() => []),
    getMonthlyTrend(companyId, queryParams).catch(() => []),
    empCountPromise.catch(() => ({ rows: [{ count: 0 }] })),
    contractCountPromise.catch(() => ({ rows: [{ count: 0 }] })),
    attendanceExceptionsPromise.catch(() => ({ rows: [{ count: 0 }] })),
    pendingLeavesPromise.catch(() => ({ rows: [{ count: 0 }] })),
    recentLeavesPromise.catch(() => ({ rows: [] })),
  ]);

  const colors = ['#7C3AED', '#3B82F6', '#059669', '#D97706', '#172554', '#EC4899'];
  const filteredCost = deptId 
    ? (salaryCost || []).filter((r) => r.department_id === deptId)
    : (salaryCost || []);
  const totalGross = (filteredCost || []).reduce((sum, r) => sum + parseFloat(r.total_gross_amount || 0), 0) || 1;
  const formattedSalaryCost = (filteredCost || []).map((r, i) => ({
    name: r.department_name,
    count: parseInt(r.employee_count, 10),
    cost: parseFloat(r.total_gross_amount || 0),
    percentage: Math.round((parseFloat(r.total_gross_amount || 0) / totalGross) * 1000) / 10,
    color: colors[i % colors.length],
  }));

  const filteredDeptOverview = deptId
    ? (departmentOverview || []).filter((d) => d.department_id === deptId)
    : (departmentOverview || []);

  const totalEmployees = empCountRes.rows[0]?.count ?? 0;
  const activeContracts = contractCountRes.rows[0]?.count ?? 0;
  const attendanceExceptions = attendanceExceptionsRes.rows[0]?.count ?? 0;
  const pendingLeaveRequests = pendingLeavesRes.rows[0]?.count ?? 0;
  const payrollWarnings = alerts?.unresolved_warnings?.length ?? 0;

  const payrunStatus = kpis?.pending_payslips_count > 0
    ? `${kpis.pending_payslips_count} Pending Payslips`
    : (kpis?.paid_payslips_count > 0 ? 'All Paid' : 'Draft Scope');

  return {
    totalEmployees,
    activeContracts,
    payrunStatus,
    pendingLeaveRequests,
    attendanceExceptions,
    payrollWarnings,
    kpis,
    alerts: alerts?.unresolved_warnings || [],
    salaryCost: formattedSalaryCost,
    attendance,
    timeOff,
    recentRequests: recentLeavesRes?.rows || [],
    departmentOverview: filteredDeptOverview,
    monthlyTrend,
  };
};

export default {
  getKpis,
  getSalaryCostByDepartment,
  getMonthlyTrend,
  getAttendanceOverview,
  getTimeOffOverview,
  getDepartmentOverview,
  getAlerts,
  getDashboardSummary,
};
