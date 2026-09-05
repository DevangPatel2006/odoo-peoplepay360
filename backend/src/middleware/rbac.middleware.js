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
export const requirePermission = (module, action) => {
  const actionColumnMap = {
    create: 'can_create',
    read: 'can_read',
    update: 'can_update',
    delete: 'can_delete',
    approve: 'can_approve',
  };

  const permColumn = actionColumnMap[action];
  if (!permColumn) {
    throw new Error(`Invalid RBAC action: "${action}". Must be create, read, update, delete, or approve.`);
  }

  return async (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.roles) || req.user.roles.length === 0) {
      return fail(res, 403, 'FORBIDDEN', 'Access denied: No role assigned to user');
    }

    try {
      const sql = `
        SELECT EXISTS (
          SELECT 1 
          FROM role_permissions rp
          JOIN roles r ON r.id = rp.role_id
          WHERE r.name = ANY($1::text[])
            AND rp.module = $2
            AND rp.${permColumn} = true
        ) AS has_permission;
      `;

      const result = await query(sql, [req.user.roles, module]);
      const hasPermission = result.rows[0]?.has_permission;

      if (!hasPermission) {
        return fail(
          res,
          403,
          'FORBIDDEN',
          `Insufficient permissions: Role(s) cannot ${action} in module '${module}'`
        );
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default {
  requirePermission,
};
