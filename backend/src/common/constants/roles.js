/**
 * PeoplePay360 Role Constants
 *
 * IMPORTANT:
 * These constants are exported purely for readability in logs, error messages,
 * and test assertions. This file must NEVER be used to make authorization decisions.
 * Authorization is strictly data-driven via rbac.middleware.js querying the
 * `role_permissions` table in PostgreSQL.
 */
export const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin',
};

export default ROLES;
