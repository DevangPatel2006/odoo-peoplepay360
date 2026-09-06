import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'peoplepay360',
  user: 'postgres',
  password: 'devang2006'
});

async function verify() {
  try {
    const empCount = await pool.query('SELECT count(id) FROM employees');
    const contractCount = await pool.query("SELECT count(id) FROM contracts WHERE status = 'Running'");
    const attCount = await pool.query('SELECT count(id) FROM attendances');
    const allocCount = await pool.query('SELECT count(id) FROM time_off_allocations');
    const reqCount = await pool.query('SELECT count(id) FROM time_off_requests');
    const payrunCount = await pool.query('SELECT count(id) FROM payruns');
    const payslipCount = await pool.query('SELECT count(id) FROM payslips');
    
    const deptDist = await pool.query(`
      SELECT d.name, count(e.id) as emp_count, sum(c.wage_per_month) as total_dept_wage
      FROM departments d
      JOIN employees e ON e.department_id = d.id
      JOIN contracts c ON c.employee_id = e.id
      WHERE c.status = 'Running'
      GROUP BY d.name
      ORDER BY total_dept_wage DESC
    `);

    const typeDist = await pool.query(`
      SELECT employee_type, count(id) as count
      FROM employees
      GROUP BY employee_type
      ORDER BY count DESC
    `);

    const sampleEmployees = await pool.query(`
      SELECT e.id, e.employee_code, e.first_name || ' ' || e.last_name as name, d.name as department, e.employee_type, c.wage_per_month
      FROM employees e
      JOIN departments d ON d.id = e.department_id
      JOIN contracts c ON c.employee_id = e.id
      ORDER BY e.id ASC
      LIMIT 15
    `);

    const salaryCostRes = await pool.query(`
      SELECT d.name as department_name, count(p.id) as slips, sum(p.gross_amount) as gross
      FROM payslips p
      JOIN employees e ON e.id = p.employee_id
      JOIN departments d ON d.id = e.department_id
      WHERE p.status = 'Paid' AND TO_CHAR(p.period_start, 'YYYY-MM') = '2026-09'
      GROUP BY d.name
      ORDER BY gross DESC
    `);

    const monthlyTrendRes = await pool.query(`
      SELECT TO_CHAR(p.period_start, 'YYYY-MM') as month, count(p.id) as slips, sum(p.gross_amount) as gross, sum(p.net_amount) as net
      FROM payslips p
      WHERE p.status = 'Paid'
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    console.log('=== SEED VERIFICATION REPORT ===');
    console.log('Total Employees:', empCount.rows[0].count);
    console.log('Running Contracts:', contractCount.rows[0].count);
    console.log('Attendance Records:', attCount.rows[0].count);
    console.log('Time Off Allocations:', allocCount.rows[0].count);
    console.log('Time Off Requests:', reqCount.rows[0].count);
    console.log('Payruns:', payrunCount.rows[0].count);
    console.log('Payslips:', payslipCount.rows[0].count);
    
    console.log('\n--- Department Headcount & Monthly Wage Commitments ---');
    console.table(deptDist.rows);

    console.log('\n--- Employee Type Distribution ---');
    console.table(typeDist.rows);

    console.log('\n--- First 15 Employees (Interleaving & Diversity Verification) ---');
    console.table(sampleEmployees.rows);

    console.log('\n--- September 2026 Salary Cost Breakdown by Department (Dashboard Pie Chart) ---');
    console.table(salaryCostRes.rows);

    console.log('\n--- Historical Monthly Payroll Trend (Dashboard Bar Chart) ---');
    console.table(monthlyTrendRes.rows);
  } finally {
    await pool.end();
  }
}

verify();
