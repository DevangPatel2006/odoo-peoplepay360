-- =============================================================================
-- Seed 03: Employees & Users (Login Accounts)
-- =============================================================================

INSERT INTO employees (
    id, company_id, employee_code, first_name, last_name, work_email, 
    personal_phone, department_id, job_position_id, manager_id, working_schedule_id, 
    work_location, employee_type, status, date_of_joining, date_of_birth, gender, 
    bank_account_number, bank_ifsc_or_swift, bank_name
) VALUES
(1, 1, 'EMP001', 'Alice', 'Admin', 'admin@peoplepay360.com', '+1-555-0101', 1, 1, NULL, 1, 'New York HQ', 'Full-time', 'Active', '2022-01-01', '1988-05-12', 'Female', 'ACC-9988776655', 'CHASUS33', 'JPMorgan Chase'),
(2, 1, 'EMP002', 'Bob', 'HRManager', 'hrmanager@peoplepay360.com', '+1-555-0102', 2, 2, 1, 1, 'New York HQ', 'Full-time', 'Active', '2022-06-15', '1990-08-22', 'Male', 'ACC-1122334455', 'WFNAUS6S', 'Wells Fargo'),
(3, 1, 'EMP003', 'Carol', 'PayrollUser', 'payrolluser@peoplepay360.com', '+1-555-0103', 2, 3, 2, 1, 'New York HQ', 'Full-time', 'Active', '2023-02-01', '1993-11-04', 'Female', 'ACC-5544332211', 'BOFAUS3N', 'Bank of America'),
(4, 1, 'EMP004', 'David', 'Engineer', 'david.engineer@peoplepay360.com', '+1-555-0104', 3, 4, 1, 1, 'Remote', 'Full-time', 'Active', '2023-05-10', '1995-03-30', 'Male', 'ACC-6677889900', 'CITIUS33', 'Citibank')
ON CONFLICT (id) DO UPDATE SET work_email = EXCLUDED.work_email;

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- Set department managers
UPDATE departments SET manager_employee_id = 1 WHERE id = 1;
UPDATE departments SET manager_employee_id = 2 WHERE id = 2;
UPDATE departments SET manager_employee_id = 4 WHERE id = 3;

-- -----------------------------------------------------------------------------
-- USERS & MULTI-ROLE ASSIGNMENTS
-- -----------------------------------------------------------------------------
INSERT INTO users (id, employee_id, work_email, password_hash, is_active) VALUES
(1, 1, 'admin@peoplepay360.com', '$2b$10$e8.Z...hash_admin', true),
(2, 2, 'hrmanager@peoplepay360.com', '$2b$10$e8.Z...hash_hrmgr', true),
(3, 3, 'payrolluser@peoplepay360.com', '$2b$10$e8.Z...hash_puser', true),
(4, 4, 'david.engineer@peoplepay360.com', '$2b$10$e8.Z...hash_emp', true)
ON CONFLICT (id) DO UPDATE SET work_email = EXCLUDED.work_email;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Assign Roles:
-- Admin User -> Admin (5)
-- HR Manager User -> HR Manager (2)
-- Payroll User -> HR Payroll User (3)
-- David Engineer -> Employee (1)
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 5),
(2, 2),
(3, 3),
(4, 1)
ON CONFLICT (user_id, role_id) DO NOTHING;
