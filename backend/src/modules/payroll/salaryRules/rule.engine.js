/**
 * Salary Rule Engine Reference & Utilities
 *
 * NOTE: As demanded by Non-Negotiable Engineering Rule #5,
 * business rule evaluation and payslip computation is fully executed
 * inside PostgreSQL via `SELECT compute_payslip($1)`.
 *
 * This file documents the evaluation sequence for salary rules:
 * Sequence 10: Basic Salary (Percentage of Wage or Fixed)
 * Sequence 20+: Allowances (HRA, Standard Allowance, Bonus, LTA, Fixed Allowance)
 * Sequence 70: Gross Salary = Basic + Allowances
 * Sequence 80+: Deductions (LWF, PF, ESIC, Professional Tax)
 * Sequence 120: Net Salary = Gross - Deductions
 */

export const RULE_EXECUTION_ENGINE = 'PostgreSQL stored function compute_payslip(p_payslip_id INT)';

export default {
  RULE_EXECUTION_ENGINE,
};
