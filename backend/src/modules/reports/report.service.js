import { query } from '../../config/db.js';

const DEPT_COLORS = {
  'Engineering': '#059669',
  'Finance & Accounting': '#0284C7',
  'Sales & Marketing': '#D97706',
  'Human Resources': '#10B981',
  'Executive': '#475569',
};

/**
 * Retrieves live database analytics for executive reports
 * @param {number} companyId 
 * @param {object} filters 
 */
export const getExecutiveReportData = async (companyId, { period = '2026-09', department = 'ALL', employeeType = 'ALL' } = {}) => {
  // 1. Department Breakdown Query
  const deptQuery = `
    SELECT 
      d.id,
      d.name,
      COUNT(DISTINCT e.id) AS headcount,
      COALESCE(SUM(c.wage_per_month), 0) AS gross_cost,
      COALESCE(AVG(c.wage_per_month), 0) AS avg_wage
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id AND ($3 = 'ALL' OR e.employee_type = $3)
    LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Running'
    WHERE d.company_id = $1 AND ($2 = 'ALL' OR d.name = $2)
    GROUP BY d.id, d.name
    ORDER BY gross_cost DESC
  `;
  const deptRes = await query(deptQuery, [companyId, department, employeeType]);

  const totalCost = deptRes.rows.reduce((acc, row) => acc + parseFloat(row.gross_cost || 0), 0);
  const totalHeadcount = deptRes.rows.reduce((acc, row) => acc + parseInt(row.headcount || 0, 10), 0);

  const deptReportData = deptRes.rows.map((row) => {
    const gross = parseFloat(row.gross_cost || 0);
    const count = parseInt(row.headcount || 0, 10);
    const percentage = totalCost > 0 ? Math.round((gross / totalCost) * 1000) / 10 : 0;
    return {
      id: row.id,
      name: row.name,
      headcount: count,
      grossCost: gross,
      avgWage: count > 0 ? Math.round((gross / count) * 100) / 100 : 0,
      percentage,
      color: DEPT_COLORS[row.name] || '#6366F1',
    };
  });

  // 2. Period Trends Query (from real payruns and payslips)
  const trendQuery = `
    SELECT 
      pr.id,
      pr.name AS period,
      TO_CHAR(pr.period_start, 'YYYY-MM') AS month_key,
      COUNT(p.id) AS employees,
      COALESCE(SUM(p.gross_amount), 0) AS total_gross,
      COALESCE(SUM(p.gross_amount - p.net_amount), 0) AS total_deductions,
      COALESCE(SUM(p.net_amount), 0) AS net_payroll,
      pr.status
    FROM payruns pr
    LEFT JOIN payslips p ON p.payrun_id = pr.id
    WHERE pr.company_id = $1
    GROUP BY pr.id, pr.name, pr.period_start, pr.status
    ORDER BY pr.period_start DESC
  `;
  const trendRes = await query(trendQuery, [companyId]);

  const periodTrendData = trendRes.rows.map((row) => ({
    id: row.id,
    period: row.period,
    monthKey: row.month_key,
    employees: parseInt(row.employees || 0, 10),
    totalGross: parseFloat(row.total_gross || 0),
    totalDeductions: parseFloat(row.total_deductions || 0),
    netPayroll: parseFloat(row.net_payroll || 0),
    status: row.status || 'Paid',
  }));

  // 3. Employee Type Query
  const typeQuery = `
    SELECT 
      e.employee_type,
      COUNT(e.id) AS count,
      COALESCE(SUM(c.wage_per_month), 0) AS total_payroll,
      COALESCE(AVG(c.wage_per_month), 0) AS avg_wage
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Running'
    WHERE e.company_id = $1 
      AND ($2 = 'ALL' OR d.name = $2)
      AND ($3 = 'ALL' OR e.employee_type = $3)
    GROUP BY e.employee_type
    ORDER BY count DESC
  `;
  const typeRes = await query(typeQuery, [companyId, department, employeeType]);

  const allEmpCount = typeRes.rows.reduce((sum, r) => sum + parseInt(r.count || 0, 10), 0);
  const employeeTypeData = typeRes.rows.map((r) => {
    const count = parseInt(r.count || 0, 10);
    const totalPayroll = parseFloat(r.total_payroll || 0);
    const avgWage = parseFloat(r.avg_wage || 0);
    const percentage = allEmpCount > 0 ? Math.round((count / allEmpCount) * 1000) / 10 : 0;
    
    // Standard working hours based on type
    const avgHours = r.employee_type === 'Full-time' ? 40.0 : r.employee_type === 'Part-time' ? 24.0 : r.employee_type === 'Contract' ? 35.0 : 20.0;

    return {
      type: r.employee_type,
      count,
      percentage,
      avgHours,
      avgWage: Math.round(avgWage * 100) / 100,
      totalPayroll,
      payrollShareFormatted: `$${totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  });

  // 4. Contract Coverage Query
  const contractQuery = `
    SELECT 
      c.status,
      COUNT(c.id) AS count
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    WHERE e.company_id = $1
    GROUP BY c.status
    ORDER BY count DESC
  `;
  const contractRes = await query(contractQuery, [companyId]);

  const totalContracts = contractRes.rows.reduce((sum, r) => sum + parseInt(r.count || 0, 10), 0);
  const contractCoverageData = contractRes.rows.map((r) => {
    const count = parseInt(r.count || 0, 10);
    const percentage = totalContracts > 0 ? `${(Math.round((count / totalContracts) * 1000) / 10).toFixed(1)}%` : '0%';
    const isRunning = r.status === 'Running';
    return {
      status: `${r.status} Contracts`,
      rawStatus: r.status,
      count,
      percentage,
      health: isRunning ? 'Active Coverage' : 'Pending Action',
      variant: isRunning ? 'success' : 'warning',
    };
  });

  // 5. Summary KPI metrics
  const summary = {
    totalHeadcount,
    totalMonthlyPayroll: totalCost,
    avgWageOverall: totalHeadcount > 0 ? Math.round((totalCost / totalHeadcount) * 100) / 100 : 0,
    activeContractCoverageRate: '100%',
    departmentsCount: deptReportData.length,
    payrunsRecorded: periodTrendData.length,
  };

  return {
    summary,
    deptReportData,
    periodTrendData,
    employeeTypeData,
    contractCoverageData,
  };
};

export default {
  getExecutiveReportData,
};
