-- =============================================================================
-- Seed 02: Companies, Departments, and Job Positions
-- =============================================================================

INSERT INTO companies (id, name, currency_code, timezone, address) VALUES
(1, 'PeoplePay Inc.', 'USD', 'America/New_York', '100 Enterprise Way, Suite 500, New York, NY 10001')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

INSERT INTO departments (id, company_id, name, parent_department_id) VALUES
(1, 1, 'Executive', NULL),
(2, 1, 'Human Resources', 1),
(3, 1, 'Engineering', 1),
(4, 1, 'Sales & Marketing', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

INSERT INTO job_positions (id, company_id, department_id, title) VALUES
(1, 1, 1, 'Chief Executive Officer'),
(2, 1, 2, 'HR Manager'),
(3, 1, 2, 'Payroll Specialist'),
(4, 1, 3, 'Senior Software Engineer'),
(5, 1, 3, 'Fullstack Developer'),
(6, 1, 4, 'Sales Executive')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

SELECT setval('job_positions_id_seq', (SELECT MAX(id) FROM job_positions));
