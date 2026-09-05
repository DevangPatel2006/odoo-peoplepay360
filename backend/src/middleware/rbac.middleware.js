import { query } from '../config/db.js';
import { fail } from '../common/utils/apiResponse.js';

/**
 * 100% Data-Driven RBAC Middleware
 *
 * Verifies if any role in req.user.roles has the required permission (can_create, can_read,
 * can_update, can_delete, can_approve) for the specified module in PostgreSQL's role_permissions table.
 *
 * @param {string} module - The system module name (from PERMISSION_MODULES)
 * @param {'create' | 'read' | 'update' | 'delete' | 'approve'} action - The operation action
 */
const actionColumnMap = {
  create: 'can_create',
  read: 'can_read',
  update: 'can_update',
  delete: 'can_delete',
  approve: 'can_approve',
};

/**
 * Checks whether user has ANY of the specified module-action permissions.
 * @param {Array<{ module: string, action: string }>} checks
 */
export const requireAnyPermission = (checks) => {
  return async (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.roles) || req.user.roles.length === 0) {
      return fail(res, 403, 'FORBIDDEN', 'Access denied: No role assigned to user');
    }

    try {
      const clauses = [];
      const params = [req.user.roles];
      let idx = 2;

      for (const check of checks) {
        const permCol = actionColumnMap[check.action];
        if (!permCol) {
          throw new Error(`Invalid RBAC action: "${check.action}". Must be create, read, update, delete, or approve.`);
        }
        clauses.push(`(rp.module = $${idx++} AND rp.${permCol} = true)`);
        params.push(check.module);
      }

      const sql = `
        SELECT EXISTS (
          SELECT 1 
          FROM role_permissions rp
          JOIN roles r ON r.id = rp.role_id
          WHERE r.name = ANY($1::text[])
            AND (${clauses.join(' OR ')})
        ) AS has_permission;
      `;

      const result = await query(sql, params);
      const hasPermission = result.rows[0]?.has_permission;

      if (!hasPermission) {
        return fail(
          res,
          403,
          'FORBIDDEN',
          'Insufficient permissions: Role(s) do not have required access'
        );
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * 100% Data-Driven RBAC Middleware
 *
 * Verifies if any role in req.user.roles has the required permission (can_create, can_read,
 * can_update, can_delete, can_approve) for the specified module(s) in PostgreSQL's role_permissions table.
 *
 * @param {string | string[]} module - The system module name(s)
 * @param {'create' | 'read' | 'update' | 'delete' | 'approve'} action - The operation action
 */
export const requirePermission = (module, action) => {
  if (Array.isArray(module)) {
    return requireAnyPermission(module.map((m) => ({ module: m, action })));
  }
  return requireAnyPermission([{ module, action }]);
};

export default {
  requirePermission,
  requireAnyPermission,
};
