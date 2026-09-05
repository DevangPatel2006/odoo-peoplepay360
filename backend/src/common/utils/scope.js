import { ROLES } from '../constants/roles.js';

/**
 * Resolves row-level data access scope based on the user's assigned roles.
 *
 * An Employee-only user has scope = 'own' (restricted to their own records).
 * Any user holding an elevated role (HR Manager, HR Payroll User, Admin, etc.)
 * has scope = 'company' (access across their entire company tenant).
 *
 * @param {object} user - req.user object containing { id, employeeId, companyId, roles }
 * @param {string} [module] - Target module name for context
 * @returns {{ scope: 'own' | 'company', employeeId: number | null }}
 */
export const resolveOwnershipScope = (user, module = '') => {
  const roles = user?.roles || [];

  // If user only holds the Employee role, scope is strictly 'own'
  const isSoleEmployee = roles.length > 0 && roles.every((role) => role === ROLES.EMPLOYEE);

  if (isSoleEmployee) {
    return {
      scope: 'own',
      employeeId: user.employeeId || null,
    };
  }

  return {
    scope: 'company',
    employeeId: user?.employeeId || null,
  };
};

export default {
  resolveOwnershipScope,
};
