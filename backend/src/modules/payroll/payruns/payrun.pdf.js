import PDFDocument from 'pdfkit';
import payrollModel from '../payroll.model.js';

/**
 * Generates an official Payrun Batch Summary & Disbursement Report PDF
 *
 * @param {number} payrunId - Payrun ID
 * @param {number} companyId - Company ID
 * @returns {Promise<Buffer>}
 */
export const generatePayrunSummaryPdf = async (payrunId, companyId) => {
  const payrun = await payrollModel.findPayrunById(payrunId, companyId);
  if (!payrun) {
    throw new Error('Payrun not found');
  }

  const payslipsRes = await payrollModel.findPayslips({
    company_id: companyId,
    payrun_id: payrunId,
    limit: 500,
    offset: 0,
  });

  const slips = payslipsRes.rows || [];
  const totalGross = slips.reduce((acc, curr) => acc + parseFloat(curr.gross_amount || 0), 0);
  const totalNet = slips.reduce((acc, curr) => acc + parseFloat(curr.net_amount || 0), 0);
  const totalDeductions = totalGross - totalNet;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.rect(36, 36, 523, 65).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
       .text('PeoplePay360', 50, 48);
    doc.fillColor('#10B981').fontSize(10).font('Helvetica')
       .text('PAYRUN BATCH DISBURSEMENT SUMMARY', 50, 72);

    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica')
       .text(`Payrun: ${payrun.name}`, 380, 48, { align: 'right', width: 165 })
       .text(`Period: ${payrun.period_start} to ${payrun.period_end}`, 380, 62, { align: 'right', width: 165 })
       .text(`Status: ${payrun.status}`, 380, 76, { align: 'right', width: 165 });

    // KPI Cards
    const kpiY = 112;
    const boxW = 125;
    const boxH = 46;

    const stats = [
      { label: 'Total Payslips', value: `${slips.length} Statements`, color: '#0F172A' },
      { label: 'Total Gross Payroll', value: `$${totalGross.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#0F172A' },
      { label: 'Total Deductions', value: `-$${Math.abs(totalDeductions).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#DC2626' },
      { label: 'Net Disbursed', value: `$${totalNet.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#059669' },
    ];

    stats.forEach((s, idx) => {
      const x = 36 + idx * (boxW + 8);
      doc.rect(x, kpiY, boxW, boxH).fill('#F8FAFC');
      doc.rect(x, kpiY, boxW, boxH).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(s.label, x + 8, kpiY + 8);
      doc.fillColor(s.color).fontSize(11).font('Helvetica-Bold').text(s.value, x + 8, kpiY + 24);
    });

    // Employee List Table
    let currentY = 170;
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
       .text('Employee Payslip Statements Breakdown', 36, currentY);

    currentY += 16;
    doc.rect(36, currentY, 523, 18).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('Code', 44, currentY + 5);
    doc.text('Employee Name', 95, currentY + 5);
    doc.text('Department', 230, currentY + 5);
    doc.text('Gross ($)', 335, currentY + 5, { width: 65, align: 'right' });
    doc.text('Net ($)', 405, currentY + 5, { width: 75, align: 'right' });
    doc.text('Status', 490, currentY + 5, { width: 55, align: 'center' });

    currentY += 20;
    doc.font('Helvetica').fontSize(8);

    slips.forEach((slip, idx) => {
      if (currentY > 740) {
        doc.addPage();
        currentY = 36;
        doc.rect(36, currentY, 523, 18).fill('#0F172A');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('Code', 44, currentY + 5);
        doc.text('Employee Name', 95, currentY + 5);
        doc.text('Department', 230, currentY + 5);
        doc.text('Gross ($)', 335, currentY + 5, { width: 65, align: 'right' });
        doc.text('Net ($)', 405, currentY + 5, { width: 75, align: 'right' });
        doc.text('Status', 490, currentY + 5, { width: 55, align: 'center' });
        currentY += 20;
        doc.font('Helvetica').fontSize(8);
      }

      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      const name = `${slip.first_name || slip.employee_first_name || ''} ${slip.last_name || slip.employee_last_name || ''}`.trim() || 'Employee';
      const code = slip.employee_code || `EMP-${slip.employee_id}`;
      const gross = parseFloat(slip.gross_amount || 0);
      const net = parseFloat(slip.net_amount || 0);

      doc.rect(36, currentY, 523, 16).fill(bg);
      doc.fillColor('#1E293B').text(code, 44, currentY + 4);
      doc.text(name, 95, currentY + 4, { width: 130, lineBreak: false, ellipsis: true });
      doc.text(slip.department_name || 'General', 230, currentY + 4, { width: 100, lineBreak: false, ellipsis: true });
      doc.text(`$${gross.toFixed(2)}`, 335, currentY + 4, { width: 65, align: 'right' });
      doc.fillColor('#059669').text(`$${net.toFixed(2)}`, 405, currentY + 4, { width: 75, align: 'right' });
      doc.fillColor('#475569').text(slip.status || 'Draft', 490, currentY + 4, { width: 55, align: 'center' });

      currentY += 16;
    });

    // Footer
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica');
    doc.text(
      'Official Payrun Disbursement Record • PeoplePay360 Payroll Engine',
      36,
      788,
      { align: 'center', width: 523 }
    );

    doc.end();
  });
};

export default {
  generatePayrunSummaryPdf,
};
