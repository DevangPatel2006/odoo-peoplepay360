-- =============================================================================
-- Seed 01: Roles & Permissions Matrix
-- Seed exactly the 5 roles and permissions matrix from Section 2.4 / 2.5
-- =============================================================================

INSERT INTO roles (id, name, description) VALUES
(1, 'Employee', 'Standard employee with read-only self access and request submission rights.'),
(2, 'HR Manager', 'Full CRUD on core HR modules (Employees, Contracts, Attendance, TimeOff), no payroll write access.'),
(3, 'HR Payroll User', 'HR Manager rights plus CRUD on Payruns & Payslips; read-only on Salary Structures & Rules.'),
(4, 'HR Payroll Manager', 'HR Payroll User rights plus full CRUD on Salary Structures and Salary Rules.'),
(5, 'Admin', 'Superuser with full CRUD across all modules including User & Role Management.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Reset sequence
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- -----------------------------------------------------------------------------
-- PERMISSIONS MATRIX SEEDING
-- -----------------------------------------------------------------------------
-- Modules: 'Employees', 'Contracts', 'Attendance', 'TimeOff', 'Payruns', 'Payslips', 'SalaryStructures', 'SalaryRules', 'Users'

-- 1. Employee Permissions (Read-only own, create own attendance & time-off requests)
INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve) VALUES
(1, 'Employees', false, true, false, false, false),
(1, 'Contracts', false, true, false, false, false),
(1, 'Attendance', true, true, false, false, false),
(1, 'TimeOff', true, true, false, false, false),
(1, 'Payslips', false, true, false, false, false)
ON CONFLICT (role_id, module) DO UPDATE SET 
can_create = EXCLUDED.can_create, can_read = EXCLUDED.can_read, can_update = EXCLUDED.can_update, can_delete = EXCLUDED.can_delete, can_approve = EXCLUDED.can_approve;

-- 2. HR Manager Permissions (Full HR CRUD + Approve/Refuse, No Payroll)
INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve) VALUES
(2, 'Employees', true, true, true, true, false),
(2, 'Contracts', true, true, true, true, false),
(2, 'Attendance', true, true, true, true, true),
(2, 'TimeOff', true, true, true, true, true),
(2, 'Payruns', false, false, false, false, false),
(2, 'Payslips', false, false, false, false, false),
(2, 'SalaryStructures', false, false, false, false, false),
(2, 'SalaryRules', false, false, false, false, false),
(2, 'Users', false, true, false, false, false)
ON CONFLICT (role_id, module) DO UPDATE SET 
can_create = EXCLUDED.can_create, can_read = EXCLUDED.can_read, can_update = EXCLUDED.can_update, can_delete = EXCLUDED.can_delete, can_approve = EXCLUDED.can_approve;

-- 3. HR Payroll User Permissions (HR Manager rights + C/R/U on Payruns & Payslips, R-only on Structures/Rules)
INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve) VALUES
(3, 'Employees', true, true, true, false, false),
(3, 'Contracts', true, true, true, false, false),
(3, 'Attendance', true, true, true, false, true),
(3, 'TimeOff', true, true, true, false, true),
(3, 'Payruns', true, true, true, false, false),
(3, 'Payslips', true, true, true, false, false),
(3, 'SalaryStructures', false, true, false, false, false),
(3, 'SalaryRules', false, true, false, false, false),
(3, 'Users', false, true, false, false, false)
ON CONFLICT (role_id, module) DO UPDATE SET 
can_create = EXCLUDED.can_create, can_read = EXCLUDED.can_read, can_update = EXCLUDED.can_update, can_delete = EXCLUDED.can_delete, can_approve = EXCLUDED.can_approve;

-- 4. HR Payroll Manager Permissions (Full HR + Full Payroll CRUD)
INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve) VALUES
(4, 'Employees', true, true, true, true, false),
(4, 'Contracts', true, true, true, true, false),
(4, 'Attendance', true, true, true, true, true),
(4, 'TimeOff', true, true, true, true, true),
(4, 'Payruns', true, true, true, true, false),
(4, 'Payslips', true, true, true, true, false),
(4, 'SalaryStructures', true, true, true, true, false),
(4, 'SalaryRules', true, true, true, true, false),
(4, 'Users', false, true, true, false, false)
ON CONFLICT (role_id, module) DO UPDATE SET 
can_create = EXCLUDED.can_create, can_read = EXCLUDED.can_read, can_update = EXCLUDED.can_update, can_delete = EXCLUDED.can_delete, can_approve = EXCLUDED.can_approve;

-- 5. Admin Permissions (Full CRUD everywhere including user management)
INSERT INTO role_permissions (role_id, module, can_create, can_read, can_update, can_delete, can_approve) VALUES
(5, 'Employees', true, true, true, true, true),
(5, 'Contracts', true, true, true, true, true),
(5, 'Attendance', true, true, true, true, true),
(5, 'TimeOff', true, true, true, true, true),
(5, 'Payruns', true, true, true, true, true),
(5, 'Payslips', true, true, true, true, true),
(5, 'SalaryStructures', true, true, true, true, true),
(5, 'SalaryRules', true, true, true, true, true),
(5, 'Users', true, true, true, true, true)
ON CONFLICT (role_id, module) DO UPDATE SET 
can_create = EXCLUDED.can_create, can_read = EXCLUDED.can_read, can_update = EXCLUDED.can_update, can_delete = EXCLUDED.can_delete, can_approve = EXCLUDED.can_approve;
