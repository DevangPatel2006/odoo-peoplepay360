-- =============================================================================
-- Seed 08: Production Clean State
-- All dummy contracts, dummy payruns, dummy payslips, and dummy leaves removed.
-- Everything will be configured from scratch by the Administrator.
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
