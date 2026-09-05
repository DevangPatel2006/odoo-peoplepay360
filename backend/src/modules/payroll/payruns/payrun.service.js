import fs from 'fs';
import { query, withTransaction } from '../../../config/db.js';
import payrollModel from '../payroll.model.js';
import contractModel from '../../contracts/contract.model.js';
import env from '../../../config/env.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const listPayruns = async (user, queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const { rows, total } = await payrollModel.findPayruns({
    company_id: user.companyId,
    status: queryParams.status,
    is_archived: queryParams.is_archived === 'true',
    search: queryParams.search,
    limit: pageSize,
    offset,
  });

  return {
    data: rows,
    meta: {
      page,
      pageSize,
      total,
    },
  };
};

export const getPayrunById = async (id, user) => {
  const payrun = await payrollModel.findPayrunById(parseInt(id, 10), user.companyId);
  if (!payrun) {
    throw new AppError('Payrun not found', 404, 'NOT_FOUND');
  }

  const employees = await payrollModel.findPayrunEmployees(payrun.id);
  const payslips = await payrollModel.findPayrunPayslips(payrun.id);
  const warnings = await payrollModel.findWarningsByPayrun(payrun.id);

  return {
    ...payrun,
    employees,
    payslips,
    warnings,
  };
};

/**
 * Step 1 Wizard: Preview Eligible Employees (Stateless - No DB Writes)
 */
export const previewEligibleEmployees = async (user, {
  salary_structure_id,
  period_start,
  period_end,
  employee_type_filter,
}) => {
  let empSql = `
    SELECT e.id, e.employee_code, e.first_name, e.last_name, e.work_email,
           e.bank_account_number, e.employee_type, e.status, d.name AS department_name, jp.title AS job_position_title
    FROM employees e
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN job_positions jp ON jp.id = e.job_position_id
    WHERE e.company_id = $1 AND e.status = 'Active'
  `;
  const params = [user.companyId];

  if (employee_type_filter) {
    empSql += ' AND e.employee_type = $2';
    params.push(employee_type_filter);
  }

  empSql += ' ORDER BY e.first_name ASC';

  const empRes = await query(empSql, params);
  const employees = empRes.rows;

  const eligible = [];
  const warnings = [];
  const skipped = [];

  for (const emp of employees) {
    try {
      const contractId = await contractModel.getApplicableContract(emp.id, period_start, period_end);
      const contract = await contractModel.findById(contractId, user.companyId);

      // Only eligible if contract uses the target salary structure (or can match)
      if (contract && (!contract.salary_structure_id || contract.salary_structure_id === parseInt(salary_structure_id, 10))) {
        const item = {
          employee: emp,
          resolved_contract: {
            id: contract.id,
            contract_number: contract.contract_number,
            wage_per_month: contract.wage_per_month,
            salary_structure_id: contract.salary_structure_id,
            status: contract.status,
          },
        };

        const empWarnings = [];
        if (!emp.bank_account_number || !emp.bank_account_number.trim()) {
          empWarnings.push('Missing bank account details');
        }
        if (contract.end_date) {
          const endDate = new Date(contract.end_date);
          const pEnd = new Date(period_end);
          const diffDays = (endDate - pEnd) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0 && diffDays <= 30) {
            empWarnings.push(`Contract expires on ${String(contract.end_date).slice(0, 10)}`);
          }
        }

        if (empWarnings.length > 0) {
          item.warning_reasons = empWarnings;
          warnings.push(item);
        } else {
          eligible.push(item);
        }
      } else {
        skipped.push({
          employee: emp,
          reason: `Contract assigned to different salary structure (ID ${contract?.salary_structure_id})`,
        });
      }
    } catch (err) {
      skipped.push({
        employee: emp,
        reason: err.message || 'No applicable contract for this period',
      });
    }
  }

  return {
    eligible,
    warnings,
    skipped,
    counts: {
      total_active_candidates: employees.length,
      eligible_count: eligible.length,
      warnings_count: warnings.length,
      skipped_count: skipped.length,
    },
  };
};

/**
 * Step 2 Wizard: Create Payrun (Persist Payrun + Payrun Employees inside Transaction)
 */
export const createPayrun = async (user, {
  name,
  salary_structure_id,
  period_start,
  period_end,
  employee_type_filter,
  employee_ids,
}) => {
  return withTransaction(async (client) => {
    // 1. Insert Payrun
    const payrunInsertSql = `
      INSERT INTO payruns (
        company_id, name, salary_structure_id, period_start, period_end,
        employee_type_filter, status, created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Draft', $7)
      RETURNING *
    `;
    const payrunRes = await client.query(payrunInsertSql, [
      user.companyId,
      name,
      salary_structure_id,
      period_start,
      period_end,
      employee_type_filter || null,
      user.id,
    ]);
    const payrun = payrunRes.rows[0];

    // 2. Resolve contract & Insert into payrun_employees
    const resolvedEmployees = [];
    const skippedEmployees = [];

    // Deduplicate incoming employee_ids array
    const uniqueEmployeeIds = [...new Set(employee_ids)];

    for (const empId of uniqueEmployeeIds) {
      try {
        const contractRes = await client.query(
          'SELECT get_applicable_contract($1, $2, $3) AS contract_id',
          [empId, period_start, period_end]
        );
        const resolvedContractId = contractRes.rows[0]?.contract_id;

        await client.query(
          `INSERT INTO payrun_employees (payrun_id, employee_id, resolved_contract_id)
           VALUES ($1, $2, $3)`,
          [payrun.id, empId, resolvedContractId]
        );

        resolvedEmployees.push({ employee_id: empId, resolved_contract_id: resolvedContractId });
      } catch (err) {
        skippedEmployees.push({ employee_id: empId, reason: err.message });
      }
    }

    if (resolvedEmployees.length === 0) {
      throw new AppError('None of the selected employees could be linked to an applicable contract', 422, 'NO_ELIGIBLE_EMPLOYEES');
    }

    return {
      payrun,
      employees: resolvedEmployees,
      skipped: skippedEmployees,
    };
  });
};

/**
 * Action: Compute Payrun
 */
export const computePayrun = async (payrunId, user) => {
  await withTransaction(async (client) => {
    const payrunRes = await client.query(
      'SELECT * FROM payruns WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [payrunId, user.companyId]
    );
    const payrun = payrunRes.rows[0];

    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'NOT_FOUND');
    }

    if (!['Draft', 'Computed'].includes(payrun.status)) {
      throw new AppError(
        `Payrun must be in 'Draft' or 'Computed' status to compute (current status: ${payrun.status})`,
        400,
        'INVALID_STATUS'
      );
    }

    // Fetch payrun_employees
    const peRes = await client.query(
      'SELECT * FROM payrun_employees WHERE payrun_id = $1',
      [payrun.id]
    );
    const payrunEmployees = peRes.rows;

    for (const pe of payrunEmployees) {
      // Check existing payslip
      const slipCheck = await client.query(
        'SELECT id FROM payslips WHERE payrun_id = $1 AND employee_id = $2',
        [payrun.id, pe.employee_id]
      );

      let payslipId;
      if (slipCheck.rows.length === 0) {
        // ---------------------------------------------------------------------
        // Worked-Days Semantics (v1 Specification):
        // worked_days is derived from recorded attendances and stored in payslips
        // for display, reporting, and audit purposes (visible on the Payslip view
        // per specification section B7). In this version, basic salary calculation
        // in stored procedure compute_payslip() evaluates full contract
        // wage_per_month without attendance proration.
        // ---------------------------------------------------------------------
        const attRes = await client.query(
          `SELECT COUNT(DISTINCT attendance_date) AS worked_days 
           FROM attendances 
           WHERE employee_id = $1 
             AND attendance_date BETWEEN $2 AND $3 
             AND status IN ('Present', 'Late')`,
          [pe.employee_id, payrun.period_start, payrun.period_end]
        );
        const workedDays = parseFloat(attRes.rows[0]?.worked_days || 0);

        const insertSlipSql = `
          INSERT INTO payslips (
            payrun_id, employee_id, contract_id, salary_structure_id,
            period_start, period_end, worked_days, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Draft')
          RETURNING id
        `;
        const newSlip = await client.query(insertSlipSql, [
          payrun.id,
          pe.employee_id,
          pe.resolved_contract_id,
          payrun.salary_structure_id,
          payrun.period_start,
          payrun.period_end,
          workedDays,
        ]);
        payslipId = newSlip.rows[0].id;
      } else {
        payslipId = slipCheck.rows[0].id;
      }

      // Delegate evaluation to DB stored function compute_payslip
      await client.query('SELECT compute_payslip($1)', [payslipId]);
    }

    // Delegate warning generation to DB stored function refresh_payroll_warnings
    await client.query('SELECT refresh_payroll_warnings($1)', [payrun.id]);

    // Update payrun status to 'Computed'
    await client.query(
      "UPDATE payruns SET status = 'Computed' WHERE id = $1",
      [payrun.id]
    );
  });

  return getPayrunById(payrunId, user);
};

/**
 * Action: Validate Payrun
 */
export const validatePayrun = async (payrunId, user, { acknowledge_warnings = false } = {}) => {
  await withTransaction(async (client) => {
    const payrunRes = await client.query(
      'SELECT * FROM payruns WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [payrunId, user.companyId]
    );
    const payrun = payrunRes.rows[0];

    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'NOT_FOUND');
    }

    if (payrun.status !== 'Computed') {
      throw new AppError(`Payrun must be in 'Computed' status to validate (current status: ${payrun.status})`, 400, 'INVALID_STATUS');
    }

    // Refresh warnings right before validation
    await client.query('SELECT refresh_payroll_warnings($1)', [payrun.id]);

    // Check for unresolved warnings
    const warnRes = await client.query(
      `SELECT COUNT(*) 
       FROM payroll_warnings pw 
       JOIN payslips p ON p.id = pw.payslip_id 
       WHERE p.payrun_id = $1 AND pw.is_resolved = false`,
      [payrun.id]
    );
    const unresolvedCount = parseInt(warnRes.rows[0].count, 10);

    if (unresolvedCount > 0 && !acknowledge_warnings) {
      throw new AppError(
        `Payrun has ${unresolvedCount} unresolved warning(s). Please review and acknowledge warnings before validating.`,
        422,
        'UNRESOLVED_WARNINGS'
      );
    }

    // Update status to 'Validated' and child payslips to 'Done'
    await client.query("UPDATE payruns SET status = 'Validated' WHERE id = $1", [payrun.id]);
    await client.query("UPDATE payslips SET status = 'Done' WHERE payrun_id = $1 AND status = 'Computed'", [payrun.id]);
  });

  return getPayrunById(payrunId, user);
};

/**
 * Action: Mark Paid
 */
export const markPaidPayrun = async (payrunId, user) => {
  await withTransaction(async (client) => {
    const payrunRes = await client.query(
      'SELECT * FROM payruns WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [payrunId, user.companyId]
    );
    const payrun = payrunRes.rows[0];

    if (!payrun) {
      throw new AppError('Payrun not found', 404, 'NOT_FOUND');
    }

    if (payrun.status !== 'Validated') {
      throw new AppError(`Payrun must be in 'Validated' status to mark as Paid (current status: ${payrun.status})`, 400, 'INVALID_STATUS');
    }

    // Update status to 'Paid' and child payslips to 'Paid'
    await client.query("UPDATE payruns SET status = 'Paid' WHERE id = $1", [payrun.id]);
    await client.query("UPDATE payslips SET status = 'Paid' WHERE payrun_id = $1 AND status = 'Done'", [payrun.id]);
  });

  return getPayrunById(payrunId, user);
};

/**
 * Action: Archive Payrun
 */
export const archivePayrun = async (payrunId, user) => {
  const payrun = await getPayrunById(payrunId, user);
  await query('UPDATE payruns SET is_archived = true WHERE id = $1', [payrun.id]);
  return getPayrunById(payrunId, user);
};

/**
 * Action: Unarchive Payrun
 */
export const unarchivePayrun = async (payrunId, user) => {
  const payrun = await getPayrunById(payrunId, user);
  await query('UPDATE payruns SET is_archived = false WHERE id = $1', [payrun.id]);
  return getPayrunById(payrunId, user);
};

/**
 * Action: Send Payslips via Email
 */
export const sendPayrunPayslips = async (payrunId, user) => {
  const payrun = await getPayrunById(payrunId, user);
  if (!payrun) {
    throw new AppError('Payrun not found', 404, 'NOT_FOUND');
  }

  const { generatePayslipPdf } = await import('../payslips/payslip.pdf.js');
  const { sendPayslipEmail } = await import('../payslips/payslip.mailer.js');

  const payslips = await payrollModel.findPayslips({
    company_id: user.companyId,
    payrun_id: payrun.id,
  });

  // Only include payslips with status IN ('Done', 'Paid')
  const readySlips = (payslips.rows || []).filter((s) => ['Done', 'Paid'].includes(s.status));
  if (readySlips.length === 0) {
    throw new AppError(
      'No validated payslips are ready to send for this payrun yet. Validate the payrun first.',
      400,
      'NO_PAYSLIPS_READY'
    );
  }

  const results = [];
  for (const slip of readySlips) {
    try {
      const fullSlip = await payrollModel.findPayslipById(slip.id, user.companyId);
      let pdfPath = fullSlip.pdf_file_path;

      if (!pdfPath || !fs.existsSync(pdfPath)) {
        pdfPath = await generatePayslipPdf(fullSlip);
        await query('UPDATE payslips SET pdf_file_path = $1 WHERE id = $2', [pdfPath, slip.id]);
      }

      const mailResult = await sendPayslipEmail(fullSlip, pdfPath);
      await query('UPDATE payslips SET sent_at = CURRENT_TIMESTAMP WHERE id = $1', [slip.id]);

      results.push({
        payslip_id: slip.id,
        email: fullSlip.work_email,
        mail_sent: mailResult.success,
        ...(mailResult.error ? { error: mailResult.error } : {}),
      });
    } catch (err) {
      results.push({
        payslip_id: slip.id,
        email: slip.work_email,
        mail_sent: false,
        error: err.message,
      });
    }
  }

  return {
    payrun_id: payrun.id,
    sent_count: results.length,
    details: results,
  };
};

export default {
  listPayruns,
  getPayrunById,
  previewEligibleEmployees,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPaidPayrun,
  archivePayrun,
  unarchivePayrun,
  sendPayrunPayslips,
};
