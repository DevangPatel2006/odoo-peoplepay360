-- =============================================================================
-- Seed 02: Fix HR Payroll User Permission Gap for TimeOff
-- Ensures HR Payroll User (role_id 3) inherits HR Manager delete permissions
-- =============================================================================

INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve)
VALUES (3, 'TimeOff', true, true, true, true, true)
ON CONFLICT (role_id, module) DO UPDATE SET 
  can_create = EXCLUDED.can_create,
  can_read = EXCLUDED.can_read,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve;
