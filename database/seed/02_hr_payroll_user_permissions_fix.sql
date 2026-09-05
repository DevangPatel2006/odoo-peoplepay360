-- =============================================================================
-- Seed 02: Fix HR Payroll User Permission Inheritance
-- Ensures HR Payroll User (role_id 3) inherits full HR Manager CRUD permissions
-- (Employees, Contracts, Attendance, TimeOff)
-- =============================================================================

INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve)
VALUES 
  (3, 'Employees', true, true, true, true, false),
  (3, 'Contracts', true, true, true, true, false),
  (3, 'Attendance', true, true, true, true, true),
  (3, 'TimeOff', true, true, true, true, true)
ON CONFLICT (role_id, module) DO UPDATE SET 
  can_create = EXCLUDED.can_create,
  can_read = EXCLUDED.can_read,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve;

-- Fix HR Manager (role_id 2) Permission for SalaryStructures (required for contract creation & assignment)
INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve)
VALUES (2, 'SalaryStructures', false, true, false, false, false)
ON CONFLICT (role_id, module) DO UPDATE SET 
  can_read = true;

-- Ensure Users module update is strictly Admin-only (role_id 5)
UPDATE role_permissions 
SET can_update = false 
WHERE role_id = 4 AND module = 'Users';


