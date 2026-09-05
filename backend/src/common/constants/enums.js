/**
 * PeoplePay360 Centralized Database Enums
 * Directly mirrors CHECK constraints in database/schema.sql
 */

// Mirrors: role_permissions.module CHECK (module IN ('Employees', 'Contracts', 'Attendance', 'TimeOff', 'Payruns', 'Payslips', 'SalaryStructures', 'SalaryRules', 'Users'))
export const PERMISSION_MODULES = [
  'Employees',
  'Contracts',
  'Attendance',
  'TimeOff',
  'Payruns',
  'Payslips',
  'SalaryStructures',
  'SalaryRules',
  'Users',
];

// Mirrors: working_schedules.status CHECK (status IN ('Active', 'Inactive'))
export const SCHEDULE_STATUSES = ['Active', 'Inactive'];

// Mirrors: working_schedule_lines.day_of_week CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
export const SCHEDULE_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Mirrors: employees.employee_type CHECK (employee_type IN ('Full-time', 'Part-time', 'Contract', 'Intern'))
export const EMPLOYEE_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];

// Mirrors: employees.status CHECK (status IN ('Active', 'Inactive', 'Archived'))
export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'Archived'];

// Mirrors: contracts.status CHECK (status IN ('Draft', 'Running', 'Expired', 'Cancelled'))
export const CONTRACT_STATUSES = ['Draft', 'Running', 'Expired', 'Cancelled'];

// Mirrors: attendances.status CHECK (status IN ('Present', 'Absent', 'Late', 'On Leave'))
export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'On Leave'];

// Mirrors: time_off_types.unit CHECK (unit IN ('Days', 'Hours'))
export const TIME_OFF_UNITS = ['Days', 'Hours'];

// Mirrors: time_off_types.approval_level CHECK (approval_level IN ('Manager', 'Officer', 'None'))
export const TIME_OFF_APPROVAL_LEVELS = ['Manager', 'Officer', 'None'];

// Mirrors: time_off_allocations.status CHECK (status IN ('Draft', 'To Approve', 'Approved', 'Refused'))
export const TIME_OFF_ALLOCATION_STATUSES = ['Draft', 'To Approve', 'Approved', 'Refused'];

// Mirrors: time_off_requests.status CHECK (status IN ('Draft', 'To Approve', 'Approved', 'Refused'))
export const TIME_OFF_REQUEST_STATUSES = ['Draft', 'To Approve', 'Approved', 'Refused'];

// Mirrors: salary_rules.category CHECK (category IN ('Basic', 'Allowance', 'Gross', 'Deduction', 'Net'))
export const SALARY_RULE_CATEGORIES = ['Basic', 'Allowance', 'Gross', 'Deduction', 'Net'];

// Mirrors: salary_rules.computation_method CHECK (computation_method IN ('Fixed', 'Percentage', 'Formula'))
export const COMPUTATION_METHODS = ['Fixed', 'Percentage', 'Formula'];

// Mirrors: salary_rules.percentage_base CHECK (percentage_base IN ('Wage', 'Basic', 'Gross', 'Custom'))
export const PERCENTAGE_BASES = ['Wage', 'Basic', 'Gross', 'Custom'];

// Mirrors: payruns.status CHECK (status IN ('Draft', 'Computed', 'Validated', 'Paid'))
export const PAYRUN_STATUSES = ['Draft', 'Computed', 'Validated', 'Paid'];

// Mirrors: payslips.status CHECK (status IN ('Draft', 'Computed', 'Done', 'Paid'))
export const PAYSLIP_STATUSES = ['Draft', 'Computed', 'Done', 'Paid'];

// Mirrors: payroll_warnings.warning_type CHECK (warning_type IN ('MissingBankDetails', 'DuplicatePayslip', 'ContractExpiringSoon', 'Other'))
export const WARNING_TYPES = [
  'MissingBankDetails',
  'DuplicatePayslip',
  'ContractExpiringSoon',
  'Other',
];

export default {
  PERMISSION_MODULES,
  SCHEDULE_STATUSES,
  SCHEDULE_DAYS,
  EMPLOYEE_TYPES,
  EMPLOYEE_STATUSES,
  CONTRACT_STATUSES,
  ATTENDANCE_STATUSES,
  TIME_OFF_UNITS,
  TIME_OFF_APPROVAL_LEVELS,
  TIME_OFF_ALLOCATION_STATUSES,
  TIME_OFF_REQUEST_STATUSES,
  SALARY_RULE_CATEGORIES,
  COMPUTATION_METHODS,
  PERCENTAGE_BASES,
  PAYRUN_STATUSES,
  PAYSLIP_STATUSES,
  WARNING_TYPES,
};
