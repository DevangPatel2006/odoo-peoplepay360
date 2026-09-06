import PDFDocument from 'pdfkit';
import { query } from '../../config/db.js';

/**
 * Generates an executive-level workforce and payroll analytics PDF report
 *
 * @param {number} companyId - Company ID
 * @param {object} filters - Report filters (period, department, employeeType)
 * @returns {Promise<Buffer>}
 */
export const generateExecutiveReportPdf = async (companyId, { period = '2026-09', department = 'ALL', employeeType = 'ALL' } = {}) => {
  // 1. Department Breakdown Query
  const deptQuery = `
    SELECT 
      d.name AS department_name,
      COUNT(DISTINCT e.id) AS total_employees,
      COUNT(p.id) AS slip_count,
      COALESCE(SUM(p.gross_amount), 0) AS total_gross,
      COALESCE(SUM(p.net_amount), 0) AS total_net,
      COALESCE(AVG(p.gross_amount), 0) AS avg_wage
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id
    LEFT JOIN payslips p ON p.employee_id = e.id AND p.status = 'Paid' AND TO_CHAR(p.period_start, 'YYYY-MM') = $1
    WHERE d.company_id = $2
    GROUP BY d.name
    ORDER BY total_gross DESC
  `;
  const deptRes = await query(deptQuery, [period, companyId]);

  // 2. Monthly Trend Query
  const trendQuery = `
    SELECT 
      TO_CHAR(p.period_start, 'YYYY-MM') AS period_month,
      COUNT(p.id) AS slips,
      COALESCE(SUM(p.gross_amount), 0) AS total_gross,
      COALESCE(SUM(p.gross_amount - p.net_amount), 0) AS total_deductions,
      COALESCE(SUM(p.net_amount), 0) AS total_net
    FROM payslips p
    JOIN payruns pr ON pr.id = p.payrun_id
    WHERE pr.company_id = $1 AND p.status = 'Paid'
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 6
  `;
  const trendRes = await query(trendQuery, [companyId]);

  // 3. Employee Type Query
  const typeQuery = `
    SELECT 
      employee_type, 
      COUNT(id) AS count,
      ROUND(COUNT(id) * 100.0 / NULLIF((SELECT COUNT(*) FROM employees WHERE company_id = $1), 0), 1) AS percentage
    FROM employees
    WHERE company_id = $1
    GROUP BY employee_type
    ORDER BY count DESC
  `;
  const typeRes = await query(typeQuery, [companyId]);

  // 4. Running Contracts Count
  const contractRes = await query(`
    SELECT COUNT(id) AS running_contracts
    FROM contracts
    WHERE status = 'Running' AND employee_id IN (SELECT id FROM employees WHERE company_id = $1)
  `, [companyId]);
  const runningContracts = parseInt(contractRes.rows[0]?.running_contracts || 0, 10);

  // 5. Total Employees
  const empCountRes = await query('SELECT COUNT(*) FROM employees WHERE company_id = $1', [companyId]);
  const totalEmployees = parseInt(empCountRes.rows[0]?.count || 0, 10);

  // Calculate totals
  const totalGrossCost = deptRes.rows.reduce((acc, curr) => acc + parseFloat(curr.total_gross || 0), 0);
  const totalNetCost = deptRes.rows.reduce((acc, curr) => acc + parseFloat(curr.total_net || 0), 0);
  const avgMonthlyWage = totalEmployees > 0 ? totalGrossCost / (deptRes.rows.reduce((a, c) => a + parseInt(c.slip_count || 0, 10), 0) || 1) : 0;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ================= HEADER BRANDING =================
    doc.rect(36, 36, 523, 70).fill('#0F172A');

    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
       .text('PeoplePay360', 52, 48);
    doc.fillColor('#10B981').fontSize(10).font('Helvetica')
       .text('EXECUTIVE WORKFORCE & PAYROLL INTELLIGENCE REPORT', 52, 74);

    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica')
       .text(`Period: ${period}`, 400, 48, { align: 'right', width: 145 })
       .text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 400, 62, { align: 'right', width: 145 })
       .text(`Scope: All Operations`, 400, 76, { align: 'right', width: 145 });

    // ================= KPI STATS BAR =================
    const kpiY = 118;
    const boxW = 125;
    const boxH = 50;

    const stats = [
      { label: 'Total Payroll Cost', value: `$${totalGrossCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#0F172A' },
      { label: 'Net Disbursed', value: `$${totalNetCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#059669' },
      { label: 'Total Workforce', value: `${totalEmployees} Employees`, color: '#0F172A' },
      { label: 'Active Contracts', value: `${runningContracts} Running`, color: '#0284C7' },
    ];

    stats.forEach((s, idx) => {
      const x = 36 + idx * (boxW + 8);
      doc.rect(x, kpiY, boxW, boxH).fill('#F8FAFC');
      doc.rect(x, kpiY, boxW, boxH).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(s.label, x + 10, kpiY + 10);
      doc.fillColor(s.color).fontSize(12).font('Helvetica-Bold').text(s.value, x + 10, kpiY + 26);
    });

    // ================= SECTION 1: DEPARTMENTAL BREAKDOWN =================
    let currentY = 184;
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold')
       .text('1. Departmental Salary Expenditure Breakdown', 36, currentY);

    currentY += 18;
    // Table Header
    doc.rect(36, currentY, 523, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Department Name', 46, currentY + 5);
    doc.text('Headcount', 190, currentY + 5, { width: 55, align: 'center' });
    doc.text('Gross Cost ($)', 255, currentY + 5, { width: 90, align: 'right' });
    doc.text('Net Pay ($)', 355, currentY + 5, { width: 90, align: 'right' });
    doc.text('% Share', 455, currentY + 5, { width: 90, align: 'right' });

    currentY += 22;
    doc.font('Helvetica').fontSize(8.5);

    deptRes.rows.forEach((dept, i) => {
      const gross = parseFloat(dept.total_gross || 0);
      const net = parseFloat(dept.total_net || 0);
      const share = totalGrossCost > 0 ? ((gross / totalGrossCost) * 100).toFixed(1) : '0.0';
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      doc.rect(36, currentY, 523, 18).fill(bg);
      doc.fillColor('#1E293B').text(dept.department_name, 46, currentY + 4);
      doc.text(String(dept.total_employees || 0), 190, currentY + 4, { width: 55, align: 'center' });
      doc.text(`$${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 255, currentY + 4, { width: 90, align: 'right' });
      doc.text(`$${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 355, currentY + 4, { width: 90, align: 'right' });
      doc.fillColor('#059669').text(`${share}%`, 455, currentY + 4, { width: 90, align: 'right' });

      currentY += 18;
    });

    // ================= SECTION 2: MONTHLY TREND =================
    currentY += 16;
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold')
       .text('2. Historical Payroll Disbursement Trend', 36, currentY);

    currentY += 18;
    doc.rect(36, currentY, 523, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Payrun Period', 46, currentY + 5);
    doc.text('Processed Slips', 190, currentY + 5, { width: 65, align: 'center' });
    doc.text('Gross Amount ($)', 265, currentY + 5, { width: 85, align: 'right' });
    doc.text('Tax Deductions ($)', 360, currentY + 5, { width: 85, align: 'right' });
    doc.text('Net Disbursed ($)', 455, currentY + 5, { width: 90, align: 'right' });

    currentY += 22;
    doc.font('Helvetica').fontSize(8.5);

    trendRes.rows.forEach((t, i) => {
      const gross = parseFloat(t.total_gross || 0);
      const ded = parseFloat(t.total_deductions || 0);
      const net = parseFloat(t.total_net || 0);
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      doc.rect(36, currentY, 523, 18).fill(bg);
      doc.fillColor('#1E293B').text(t.period_month, 46, currentY + 4);
      doc.text(String(t.slips), 190, currentY + 4, { width: 65, align: 'center' });
      doc.text(`$${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 265, currentY + 4, { width: 85, align: 'right' });
      doc.fillColor('#DC2626').text(`-$${ded.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 360, currentY + 4, { width: 85, align: 'right' });
      doc.fillColor('#059669').text(`$${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 455, currentY + 4, { width: 90, align: 'right' });

      currentY += 18;
    });

    // ================= SECTION 3: EMPLOYEE TYPE DIVERSITY =================
    currentY += 16;
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold')
       .text('3. Workforce Composition by Employment Type', 36, currentY);

    currentY += 18;
    doc.rect(36, currentY, 523, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Employment Type', 46, currentY + 5);
    doc.text('Employee Count', 250, currentY + 5, { width: 80, align: 'center' });
    doc.text('Share of Workforce (%)', 400, currentY + 5, { width: 145, align: 'right' });

    currentY += 22;
    doc.font('Helvetica').fontSize(8.5);

    typeRes.rows.forEach((typ, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(36, currentY, 523, 18).fill(bg);
      doc.fillColor('#1E293B').text(typ.employee_type, 46, currentY + 4);
      doc.text(String(typ.count), 250, currentY + 4, { width: 80, align: 'center' });
      doc.fillColor('#0284C7').text(`${typ.percentage}%`, 400, currentY + 4, { width: 145, align: 'right' });

      currentY += 18;
    });

    // ================= FOOTER =================
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica');
    doc.text(
      'Confidential Executive Document • Generated by PeoplePay360 Enterprise Analytics Engine',
      36,
      785,
      { align: 'center', width: 523 }
    );

    doc.end();
  });
};

export default {
  generateExecutiveReportPdf,
};
