-- =============================================================================
-- Seed 06: Time Off Types, Sample Contracts, and Allocations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TIME OFF TYPES SEEDING
-- -----------------------------------------------------------------------------
INSERT INTO time_off_types (
    id, name, unit, requires_allocation, approval_level, affects_payroll, display_color, is_active
) VALUES
(1, 'Paid Time Off', 'Days', true, 'Manager', true, '#10B981', true),
(2, 'Sick Leave', 'Days', false, 'Manager', true, '#EF4444', true),
(3, 'Comp Off', 'Hours', true, 'Officer', true, '#F59E0B', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('time_off_types_id_seq', (SELECT MAX(id) FROM time_off_types));

-- -----------------------------------------------------------------------------
-- SAMPLE CONTRACTS SEEDING
-- Rule #1: Only one Running contract per employee at a time
-- -----------------------------------------------------------------------------
INSERT INTO contracts (
    id, contract_number, employee_id, department_id, job_position_id, 
    working_schedule_id, salary_structure_id, wage_per_month, start_date, end_date, status, notes
) VALUES
(1, 'CON/2026/0001', 1, 1, 1, 1, 1, 12000.00, '2022-01-01', NULL, 'Running', 'Executive Contract'),
(2, 'CON/2026/0002', 2, 2, 2, 1, 1, 8500.00, '2022-06-15', NULL, 'Running', 'HR Manager Contract'),
(3, 'CON/2026/0003', 3, 2, 3, 1, 1, 6500.00, '2023-02-01', NULL, 'Running', 'Payroll Specialist Contract'),
(4, 'CON/2026/0004', 4, 3, 4, 1, 1, 9500.00, '2023-05-10', NULL, 'Running', 'Senior Software Engineer Contract')
ON CONFLICT (id) DO UPDATE SET contract_number = EXCLUDED.contract_number;

SELECT setval('contracts_id_seq', (SELECT MAX(id) FROM contracts));

-- -----------------------------------------------------------------------------
-- SAMPLE TIME OFF ALLOCATIONS SEEDING
-- -----------------------------------------------------------------------------
INSERT INTO time_off_allocations (
    id, employee_id, time_off_type_id, allocated_amount, taken_amount, status, approver_id, validity_start, validity_end, description
) VALUES
(1, 1, 1, 20.00, 0.00, 'Approved', 1, '2026-01-01', '2026-12-31', 'Annual PTO Allocation 2026'),
(2, 2, 1, 20.00, 2.00, 'Approved', 1, '2026-01-01', '2026-12-31', 'Annual PTO Allocation 2026'),
(3, 3, 1, 20.00, 0.00, 'Approved', 2, '2026-01-01', '2026-12-31', 'Annual PTO Allocation 2026'),
(4, 4, 1, 20.00, 5.00, 'Approved', 1, '2026-01-01', '2026-12-31', 'Annual PTO Allocation 2026')
ON CONFLICT (id) DO UPDATE SET allocated_amount = EXCLUDED.allocated_amount;

SELECT setval('time_off_allocations_id_seq', (SELECT MAX(id) FROM time_off_allocations));
