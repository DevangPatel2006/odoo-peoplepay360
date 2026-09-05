-- =============================================================================
-- Seed 08: End-to-End Demo Seed Data (Contracts, Attendance, Time-off, & Paid Payrun)
-- =============================================================================

-- 1. RUNNING CONTRACTS FOR SEEDED EMPLOYEES
INSERT INTO contracts (
    id, contract_number, employee_id, department_id, job_position_id, 
    working_schedule_id, salary_structure_id, wage_per_month, start_date, status
) VALUES
(1, 'CON-2022-001', 1, 1, 1, 1, 1, 8000.00, '2022-01-01', 'Running'),
(2, 'CON-2022-002', 2, 2, 2, 1, 1, 6500.00, '2022-06-15', 'Running'),
(3, 'CON-2023-003', 3, 2, 3, 1, 1, 5500.00, '2023-02-01', 'Running'),
(4, 'CON-2023-004', 4, 3, 4, 1, 1, 7200.00, '2023-05-10', 'Running')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, wage_per_month = EXCLUDED.wage_per_month;

SELECT setval('contracts_id_seq', (SELECT MAX(id) FROM contracts));

-- 2. LEAVE ALLOCATIONS
INSERT INTO time_off_allocations (
    id, employee_id, time_off_type_id, allocated_amount, taken_amount, status, validity_start, validity_end
) VALUES
(1, 1, 1, 20.00, 2.00, 'Approved', '2026-01-01', '2026-12-31'),
(2, 2, 1, 20.00, 0.00, 'Approved', '2026-01-01', '2026-12-31'),
(3, 3, 1, 20.00, 1.00, 'Approved', '2026-01-01', '2026-12-31'),
(4, 4, 1, 20.00, 0.00, 'Approved', '2026-01-01', '2026-12-31')
ON CONFLICT (id) DO NOTHING;

SELECT setval('time_off_allocations_id_seq', (SELECT MAX(id) FROM time_off_allocations));

-- 3. HISTORICAL COMPLETED & PAID PAYRUN FOR LAST MONTH (August 2026)
INSERT INTO payruns (
    id, company_id, name, salary_structure_id, period_start, period_end, status, created_by_user_id
) VALUES
(1, 1, 'August 2026 Monthly Payroll Batch', 1, '2026-08-01', '2026-08-31', 'Paid', 1)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

SELECT setval('payruns_id_seq', (SELECT MAX(id) FROM payruns));

-- Link payrun employees
INSERT INTO payrun_employees (payrun_id, employee_id, resolved_contract_id) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4)
ON CONFLICT (payrun_id, employee_id) DO NOTHING;

-- Create Payslips for historical paid payrun
INSERT INTO payslips (
    id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, 
    worked_days, basic_amount, gross_amount, net_amount, status
) VALUES
(1, 1, 1, 1, 1, '2026-08-01', '2026-08-31', 22, 4000.00, 9600.00, 8920.00, 'Paid'),
(2, 1, 2, 2, 1, '2026-08-01', '2026-08-31', 22, 3250.00, 7050.00, 6460.00, 'Paid'),
(3, 1, 3, 3, 1, '2026-08-01', '2026-08-31', 22, 2750.00, 5800.00, 5290.00, 'Paid'),
(4, 1, 4, 4, 1, '2026-08-01', '2026-08-31', 22, 3600.00, 8740.00, 7924.00, 'Paid')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

SELECT setval('payslips_id_seq', (SELECT MAX(id) FROM payslips));

-- Evaluate payslip lines for payslip 1 (Alice Admin)
INSERT INTO payslip_lines (payslip_id, salary_rule_id, rule_name, code, category, sequence, computed_amount) VALUES
(1, 1, 'Basic Salary', 'BASIC', 'Basic', 10, 4000.00),
(1, 2, 'House Rent Allowance', 'HRA', 'Allowance', 20, 1600.00),
(1, 3, 'Standard Allowance', 'STD_ALLOW', 'Allowance', 30, 2500.00),
(1, 4, 'Performance Bonus', 'BONUS', 'Allowance', 40, 1500.00),
(1, 7, 'Gross Salary', 'GROSS', 'Gross', 70, 9600.00),
(1, 9, 'Provident Fund', 'PF', 'Deduction', 90, 480.00),
(1, 11, 'Professional Tax', 'PT', 'Deduction', 110, 200.00),
(1, 12, 'Net Salary', 'NET', 'Net', 120, 8920.00)
ON CONFLICT DO NOTHING;

-- Evaluate payslip lines for payslip 2 (Bob HRManager)
INSERT INTO payslip_lines (payslip_id, salary_rule_id, rule_name, code, category, sequence, computed_amount) VALUES
(2, 1, 'Basic Salary', 'BASIC', 'Basic', 10, 3250.00),
(2, 2, 'House Rent Allowance', 'HRA', 'Allowance', 20, 1300.00),
(2, 3, 'Standard Allowance', 'STD_ALLOW', 'Allowance', 30, 2500.00),
(2, 7, 'Gross Salary', 'GROSS', 'Gross', 70, 7050.00),
(2, 9, 'Provident Fund', 'PF', 'Deduction', 90, 390.00),
(2, 11, 'Professional Tax', 'PT', 'Deduction', 110, 200.00),
(2, 12, 'Net Salary', 'NET', 'Net', 120, 6460.00)
ON CONFLICT DO NOTHING;
