-- =============================================================================
-- Seed 04: Production Clean State — Root Administrator Provisioning
-- Only 1 root Administrator is provisioned.
-- All employees, contracts, and payroll are configured by the Administrator.
-- =============================================================================

-- Clear any dummy workflow demo records if present
DELETE FROM payroll_warnings;
DELETE FROM payslip_lines;
DELETE FROM payslips;
DELETE FROM payrun_employees;
DELETE FROM payruns;
DELETE FROM time_off_requests;
DELETE FROM time_off_allocations;
DELETE FROM attendances;
DELETE FROM contracts;

-- Clean up any non-admin demo users & employees
DELETE FROM user_roles WHERE user_id > 1;
DELETE FROM users WHERE id > 1;
DELETE FROM employees WHERE id > 1;

-- Provision the Root System Administrator Employee
INSERT INTO employees (
    id, company_id, employee_code, first_name, last_name, work_email, 
    personal_phone, department_id, job_position_id, manager_id, working_schedule_id, 
    work_location, employee_type, status, date_of_joining, date_of_birth, gender, bank_account_number
) VALUES
(1, 1, 'EMP001', 'System', 'Admin', 'admin@peoplepay360.com', '+1-555-0101', 1, 1, NULL, 1, 'Headquarters', 'Full-time', 'Active', '2026-01-01', '1990-01-01', 'Other', 'US1234567890')
ON CONFLICT (id) DO UPDATE SET work_email = EXCLUDED.work_email, bank_account_number = EXCLUDED.bank_account_number;

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- Set department manager for Executive
UPDATE departments SET manager_employee_id = 1 WHERE id = 1;

-- Seed ONLY the System Administrator account (Password: Password123!)
INSERT INTO users (id, employee_id, work_email, password_hash, is_active) VALUES
(1, 1, 'admin@peoplepay360.com', '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true)
ON CONFLICT (id) DO UPDATE SET 
    work_email = EXCLUDED.work_email,
    password_hash = EXCLUDED.password_hash;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Assign Admin Role (5)
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 5)
ON CONFLICT (user_id, role_id) DO NOTHING;
