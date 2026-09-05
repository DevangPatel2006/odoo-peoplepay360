import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import env from '../../../config/env.js';

/**
 * Generates a production-grade Payslip PDF document
 *
 * @param {object} payslip - Full payslip object with joined employee, lines, etc.
 * @returns {Promise<string>} - Absolute path to the generated PDF file
 */
export const generatePayslipPdf = async (payslip) => {
  const outputDir = env.pdf.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `payslip_${payslip.id}_${payslip.employee_code}.pdf`;
  const filePath = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header Branding
    doc.fillColor('#1E293B').fontSize(22).text('PeoplePay360', 40, 40, { bold: true });
    doc.fillColor('#64748B').fontSize(10).text('Enterprise HR & Payroll Platform', 40, 68);
    doc.fillColor('#0F172A').fontSize(14).text(`PAYSLIP #${payslip.id}`, 420, 40, { align: 'right' });
    doc.fillColor('#64748B').fontSize(9).text(`Status: ${payslip.status}`, 420, 58, { align: 'right' });
    doc.text(`Period: ${payslip.period_start} to ${payslip.period_end}`, 420, 72, { align: 'right' });

    doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#CBD5E1').lineWidth(1).stroke();

    // Employee & Payroll Info Box
    doc.fillColor('#0F172A').fontSize(11).text('Employee Information', 40, 110, { bold: true });
    doc.fontSize(9).fillColor('#334155');
    doc.text(`Name: ${payslip.employee_first_name} ${payslip.employee_last_name}`, 40, 128);
    doc.text(`Employee Code: ${payslip.employee_code}`, 40, 142);
    doc.text(`Department: ${payslip.department_name || 'N/A'}`, 40, 156);
    doc.text(`Designation: ${payslip.job_position_title || 'N/A'}`, 40, 170);

    doc.fillColor('#0F172A').fontSize(11).text('Payroll Details', 320, 110, { bold: true });
    doc.fontSize(9).fillColor('#334155');
    doc.text(`Payrun: ${payslip.payrun_name || 'N/A'}`, 320, 128);
    doc.text(`Structure: ${payslip.salary_structure_name || 'N/A'}`, 320, 142);
    doc.text(`Monthly Wage: $${parseFloat(payslip.contract_wage || 0).toFixed(2)}`, 320, 156);
    doc.text(`Worked Days: ${payslip.worked_days}`, 320, 170);

    doc.moveTo(40, 195).lineTo(555, 195).strokeColor('#E2E8F0').lineWidth(1).stroke();

    // Table Header
    let y = 210;
    doc.rect(40, y, 515, 22).fill('#F1F5F9');
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Seq', 50, y + 6);
    doc.text('Rule Name', 90, y + 6);
    doc.text('Code', 260, y + 6);
    doc.text('Category', 340, y + 6);
    doc.text('Amount ($)', 460, y + 6, { align: 'right', width: 85 });

    // Table Lines
    y += 28;
    doc.font('Helvetica').fontSize(9);

    const lines = payslip.lines || [];
    for (const line of lines) {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }

      const isDeduction = line.category === 'Deduction';
      const isTotal = line.category === 'Gross' || line.category === 'Net';

      if (isTotal) {
        doc.font('Helvetica-Bold').fillColor('#0F172A');
      } else if (isDeduction) {
        doc.font('Helvetica').fillColor('#DC2626');
      } else {
        doc.font('Helvetica').fillColor('#334155');
      }

      doc.text(String(line.sequence), 50, y);
      doc.text(line.rule_name, 90, y, { width: 160 });
      doc.text(line.code, 260, y);
      doc.text(line.category, 340, y);

      const amountFormatted = `${isDeduction ? '-' : ''}$${parseFloat(line.computed_amount).toFixed(2)}`;
      doc.text(amountFormatted, 460, y, { align: 'right', width: 85 });

      y += 18;
      doc.moveTo(40, y - 2).lineTo(555, y - 2).strokeColor('#F8FAFC').lineWidth(0.5).stroke();
    }

    // Totals Box
    y += 15;
    if (y > 700) {
      doc.addPage();
      y = 40;
    }

    doc.rect(300, y, 255, 75).fill('#F8FAFC');
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica');
    doc.text('Basic Salary:', 315, y + 10);
    doc.text(`$${parseFloat(payslip.basic_amount || 0).toFixed(2)}`, 450, y + 10, { align: 'right', width: 95 });

    doc.text('Gross Salary:', 315, y + 26);
    doc.text(`$${parseFloat(payslip.gross_amount || 0).toFixed(2)}`, 450, y + 26, { align: 'right', width: 95 });

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A');
    doc.text('Net Payable:', 315, y + 48);
    doc.fillColor('#047857').text(`$${parseFloat(payslip.net_amount || 0).toFixed(2)}`, 450, y + 48, { align: 'right', width: 95 });

    // Footer
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica');
    doc.text('Computer-generated payslip. No physical signature required.', 40, 780, { align: 'center', width: 515 });

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
};

export default {
  generatePayslipPdf,
};
