-- =============================================================================
-- PeoplePay360 Migration 003: Surgical Bugfixes
-- Fixes refresh_payroll_warnings FORMAT specifier, v_time_off_overview fan-out,
-- and v_payslip_status_and_alerts distinct payslip count.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BUG 1 FIX — refresh_payroll_warnings FORMAT() specifier fix
-- Corrects (ID %) to (ID %s) in missing bank details warning message format string.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_payroll_warnings(p_payrun_id INT)
RETURNS INT AS $$
DECLARE
    v_payrun RECORD;
    v_payslip RECORD;
    v_warning_count INT := 0;
BEGIN
    SELECT * INTO v_payrun FROM payruns WHERE id = p_payrun_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payrun ID % not found', p_payrun_id;
    END IF;

    -- Clear ONLY unresolved warnings for this payrun's payslips
    DELETE FROM payroll_warnings 
    WHERE is_resolved = false 
      AND payslip_id IN (SELECT id FROM payslips WHERE payrun_id = p_payrun_id);

    -- 1. Check Missing Bank Details (Fixed format specifier: ID %s)
    FOR v_payslip IN 
        SELECT p.id AS payslip_id, e.id AS employee_id, e.first_name, e.last_name, e.bank_account_number
        FROM payslips p
        JOIN employees e ON p.employee_id = e.id
        WHERE p.payrun_id = p_payrun_id
          AND (e.bank_account_number IS NULL OR TRIM(e.bank_account_number) = '')
    LOOP
        INSERT INTO payroll_warnings (payslip_id, warning_type, message)
        VALUES (
            v_payslip.payslip_id, 
            'MissingBankDetails', 
            FORMAT('Employee %s %s (ID %s) is missing bank account details.', v_payslip.first_name, v_payslip.last_name, v_payslip.employee_id)
        );
        v_warning_count := v_warning_count + 1;
    END LOOP;

    -- 2. Check Duplicate Payslips
    FOR v_payslip IN 
        SELECT p1.id AS payslip_id, e.first_name, e.last_name, p2.payrun_id AS duplicate_payrun_id
        FROM payslips p1
        JOIN employees e ON p1.employee_id = e.id
        JOIN payslips p2 ON p1.employee_id = p2.employee_id AND p1.id <> p2.id
        WHERE p1.payrun_id = p_payrun_id
          AND p1.period_start <= p2.period_end 
          AND p1.period_end >= p2.period_start
    LOOP
        INSERT INTO payroll_warnings (payslip_id, warning_type, message)
        VALUES (
            v_payslip.payslip_id, 
            'DuplicatePayslip', 
            FORMAT('Employee %s %s has overlapping payslip in Payrun ID %s.', v_payslip.first_name, v_payslip.last_name, v_payslip.duplicate_payrun_id)
        );
        v_warning_count := v_warning_count + 1;
    END LOOP;

    -- 3. Check Expiring Contracts
    FOR v_payslip IN 
        SELECT p.id AS payslip_id, c.id AS contract_id, e.first_name, e.last_name, c.end_date
        FROM payslips p
        JOIN contracts c ON p.contract_id = c.id
        JOIN employees e ON p.employee_id = e.id
        WHERE p.payrun_id = p_payrun_id
          AND c.end_date IS NOT NULL 
          AND c.end_date BETWEEN v_payrun.period_end AND (v_payrun.period_end + INTERVAL '30 days')
    LOOP
        INSERT INTO payroll_warnings (payslip_id, contract_id, warning_type, message)
        VALUES (
            v_payslip.payslip_id, 
            v_payslip.contract_id,
            'ContractExpiringSoon', 
            FORMAT('Contract for %s %s expires on %s.', v_payslip.first_name, v_payslip.last_name, v_payslip.end_date)
        );
        v_warning_count := v_warning_count + 1;
    END LOOP;

    RETURN v_warning_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- BUG 3 FIX — v_time_off_overview aggregate subqueries
-- Separates request and allocation aggregations into subqueries to prevent cross-join fan-out.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_time_off_overview AS
SELECT
    tot.id AS time_off_type_id,
    tot.name AS time_off_type_name,
    tot.unit,
    COALESCE(req.total_requests_count, 0) AS total_requests_count,
    COALESCE(req.approved_amount, 0.00) AS approved_amount,
    COALESCE(req.pending_amount, 0.00) AS pending_amount,
    COALESCE(alloc.total_allocated, 0.00) AS total_allocated,
    COALESCE(alloc.total_remaining, 0.00) AS total_remaining
FROM time_off_types tot
LEFT JOIN (
    SELECT
        time_off_type_id,
        COUNT(id) AS total_requests_count,
        SUM(CASE WHEN status = 'Approved' THEN duration ELSE 0 END) AS approved_amount,
        SUM(CASE WHEN status = 'To Approve' THEN duration ELSE 0 END) AS pending_amount
    FROM time_off_requests
    GROUP BY time_off_type_id
) req ON req.time_off_type_id = tot.id
LEFT JOIN (
    SELECT
        time_off_type_id,
        SUM(allocated_amount) AS total_allocated,
        SUM(remaining_amount) AS total_remaining
    FROM time_off_allocations
    GROUP BY time_off_type_id
) alloc ON alloc.time_off_type_id = tot.id;

-- -----------------------------------------------------------------------------
-- BUG 4 FIX — v_payslip_status_and_alerts COUNT(DISTINCT p.id)
-- Fixes payslip count inflation when a payslip has multiple warnings attached.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_payslip_status_and_alerts AS
SELECT 
    p.payrun_id,
    p.status AS payslip_status,
    COUNT(DISTINCT p.id) AS payslip_count,
    COUNT(pw.id) AS warning_count,
    STRING_AGG(DISTINCT pw.warning_type, ', ') AS warning_types
FROM payslips p
LEFT JOIN payroll_warnings pw ON pw.payslip_id = p.id AND pw.is_resolved = false
GROUP BY p.payrun_id, p.status;

-- =============================================================================
-- VERIFICATION BLOCK: Validates Bugs 1, 3, and 4 Fixes
-- =============================================================================
DO $$
DECLARE
    v_test_emp_id INT;
    v_test_contract_id INT;
    v_test_payrun_id INT;
    v_test_payslip_id INT;
    v_missing_bank_warn_count INT;
    
    v_test_type_id INT;
    v_alloc1_id INT;
    v_alloc2_id INT;
    v_req1_id INT;
    v_req2_id INT;
    v_view_req_count INT;
    v_view_allocated NUMERIC(12,2);
    
    v_view_payslip_count INT;
    v_view_warning_count INT;
BEGIN
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'STARTING MIGRATION 003 BUGFIXES VERIFICATION CHECKS';
    RAISE NOTICE '------------------------------------------------------------';

    -- -------------------------------------------------------------------------
    -- Test (a): Bug 1 Fix - refresh_payroll_warnings FORMAT() with NULL bank details
    -- -------------------------------------------------------------------------
    INSERT INTO employees (company_id, employee_code, first_name, last_name, work_email, employee_type, status, date_of_joining, bank_account_number)
    VALUES (1, 'EMP_BUG1_TEST', 'NoBank', 'Employee', 'nobank.test@peoplepay360.com', 'Full-time', 'Active', CURRENT_DATE, NULL)
    RETURNING id INTO v_test_emp_id;

    INSERT INTO contracts (contract_number, employee_id, salary_structure_id, wage_per_month, start_date, status)
    VALUES ('CON_BUG1_TEST', v_test_emp_id, 1, 4000.00, CURRENT_DATE - 30, 'Running')
    RETURNING id INTO v_test_contract_id;

    INSERT INTO payruns (company_id, name, salary_structure_id, period_start, period_end, status)
    VALUES (1, 'Bug 1 Test Payrun', 1, CURRENT_DATE - 30, CURRENT_DATE, 'Draft')
    RETURNING id INTO v_test_payrun_id;

    INSERT INTO payslips (payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, status)
    VALUES (v_test_payrun_id, v_test_emp_id, v_test_contract_id, 1, CURRENT_DATE - 30, CURRENT_DATE, 'Draft')
    RETURNING id INTO v_test_payslip_id;

    -- Call refresh_payroll_warnings (must not crash on FORMAT specifier)
    PERFORM refresh_payroll_warnings(v_test_payrun_id);

    SELECT COUNT(*) INTO v_missing_bank_warn_count
    FROM payroll_warnings
    WHERE payslip_id = v_test_payslip_id AND warning_type = 'MissingBankDetails';

    IF v_missing_bank_warn_count = 1 THEN
        RAISE NOTICE '✅ Bug 1 Verified: refresh_payroll_warnings() executed without FORMAT crash and created MissingBankDetails warning.';
    ELSE
        RAISE EXCEPTION '❌ Bug 1 Failed: MissingBankDetails warning was not created!';
    END IF;

    -- -------------------------------------------------------------------------
    -- Test (b): Bug 3 Fix - v_time_off_overview Fan-out Check
    -- -------------------------------------------------------------------------
    INSERT INTO time_off_types (name, unit, requires_allocation, approval_level, affects_payroll, display_color, is_active)
    VALUES ('Bug3 Test Leave', 'Days', true, 'Manager', true, '#FF00FF', true)
    RETURNING id INTO v_test_type_id;

    -- 2 Allocations of 10 days each = 20 total allocated
    INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_amount, taken_amount, status, validity_start, validity_end)
    VALUES 
        (v_test_emp_id, v_test_type_id, 10.00, 0.00, 'Approved', CURRENT_DATE - 10, CURRENT_DATE + 30) RETURNING id INTO v_alloc1_id;
    INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_amount, taken_amount, status, validity_start, validity_end)
    VALUES 
        (v_test_emp_id, v_test_type_id, 10.00, 0.00, 'Approved', CURRENT_DATE - 10, CURRENT_DATE + 30) RETURNING id INTO v_alloc2_id;

    -- 2 Requests of 2 days each = 2 total requests count
    INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, allocation_id)
    VALUES 
        (v_test_emp_id, v_test_type_id, CURRENT_DATE, CURRENT_DATE + 1, 2.00, 'Approved', v_alloc1_id) RETURNING id INTO v_req1_id;
    INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, allocation_id)
    VALUES 
        (v_test_emp_id, v_test_type_id, CURRENT_DATE + 2, CURRENT_DATE + 3, 2.00, 'Approved', v_alloc2_id) RETURNING id INTO v_req2_id;

    SELECT total_requests_count, total_allocated INTO v_view_req_count, v_view_allocated
    FROM v_time_off_overview
    WHERE time_off_type_id = v_test_type_id;

    IF v_view_req_count = 2 AND v_view_allocated = 20.00 THEN
        RAISE NOTICE '✅ Bug 3 Verified: v_time_off_overview correctly calculated total_requests_count = % and total_allocated = % (no fan-out).', v_view_req_count, v_view_allocated;
    ELSE
        RAISE EXCEPTION '❌ Bug 3 Failed: Fan-out inflation detected! total_requests_count = %, total_allocated = %', v_view_req_count, v_view_allocated;
    END IF;

    -- -------------------------------------------------------------------------
    -- Test (c): Bug 4 Fix - v_payslip_status_and_alerts COUNT(DISTINCT p.id)
    -- -------------------------------------------------------------------------
    -- Insert a second warning for the test payslip (now has 2 unresolved warnings)
    INSERT INTO payroll_warnings (payslip_id, warning_type, message, is_resolved)
    VALUES (v_test_payslip_id, 'Other', 'Test Second Warning', false);

    SELECT payslip_count, warning_count INTO v_view_payslip_count, v_view_warning_count
    FROM v_payslip_status_and_alerts
    WHERE payrun_id = v_test_payrun_id AND payslip_status = 'Draft';

    IF v_view_payslip_count = 1 AND v_view_warning_count = 2 THEN
        RAISE NOTICE '✅ Bug 4 Verified: v_payslip_status_and_alerts correctly reported payslip_count = % and warning_count = %.', v_view_payslip_count, v_view_warning_count;
    ELSE
        RAISE EXCEPTION '❌ Bug 4 Failed: Incorrect count! payslip_count = %, warning_count = %', v_view_payslip_count, v_view_warning_count;
    END IF;

    -- -------------------------------------------------------------------------
    -- Cleanup Test Records
    -- -------------------------------------------------------------------------
    DELETE FROM payroll_warnings WHERE payslip_id = v_test_payslip_id;
    DELETE FROM payslips WHERE id = v_test_payslip_id;
    DELETE FROM payruns WHERE id = v_test_payrun_id;
    DELETE FROM contracts WHERE id = v_test_contract_id;
    DELETE FROM time_off_requests WHERE id IN (v_req1_id, v_req2_id);
    DELETE FROM time_off_allocations WHERE id IN (v_alloc1_id, v_alloc2_id);
    DELETE FROM time_off_types WHERE id = v_test_type_id;
    DELETE FROM employees WHERE id = v_test_emp_id;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'ALL MIGRATION 003 BUGFIX CHECKS PASSED SUCCESSFULLY! ✅';
    RAISE NOTICE '------------------------------------------------------------';
END $$;
