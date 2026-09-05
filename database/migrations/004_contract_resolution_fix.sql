-- =============================================================================
-- Migration 004: Permanent Contract Resolution Function Overload Fix
-- =============================================================================

-- 1. Unconditionally drop the obsolete 3-argument overload.
-- This must run first outside any DO block to eliminate overload ambiguity.
DROP FUNCTION IF EXISTS get_applicable_contract(INT, DATE, DATE);

-- 2. Re-establish the canonical 4-argument version with optional p_include_expired default.
CREATE OR REPLACE FUNCTION get_applicable_contract(
    p_employee_id INT,
    p_period_start DATE,
    p_period_end DATE,
    p_include_expired BOOLEAN DEFAULT false
) RETURNS INT AS $$
DECLARE
    v_contract_id INT;
    v_count INT;
    v_statuses TEXT[];
BEGIN
    v_statuses := CASE WHEN p_include_expired THEN ARRAY['Running','Expired'] ELSE ARRAY['Running'] END;

    SELECT COUNT(*), MAX(id)
    INTO v_count, v_contract_id
    FROM contracts
    WHERE employee_id = p_employee_id
      AND status = ANY(v_statuses)
      AND start_date <= p_period_end
      AND (end_date IS NULL OR end_date >= p_period_start);

    IF v_count = 0 THEN
        RAISE EXCEPTION 'No applicable contract found for employee ID % covering period % to %',
            p_employee_id, p_period_start, p_period_end;
    ELSIF v_count > 1 THEN
        RAISE EXCEPTION 'Ambiguous contracts: % matching contracts found for employee ID % covering period % to %',
            v_count, p_employee_id, p_period_start, p_period_end;
    END IF;

    RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Standalone verification block
DO $$
DECLARE
    v_overload_count INT;
    v_test_emp_id INT;
    v_draft_contract_id INT;
    v_running_contract_id INT;
    v_resolved_contract_id INT;
BEGIN
    -- Assert exactly one overload exists in the public schema
    SELECT COUNT(*)
    INTO v_overload_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'get_applicable_contract'
      AND n.nspname = 'public';

    IF v_overload_count <> 1 THEN
        RAISE EXCEPTION 'Regression check failed: Expected exactly 1 overload for get_applicable_contract, found %', v_overload_count;
    END IF;

    -- Quick functional check: create test employee + Draft contract + Running contract
    INSERT INTO employees (
        company_id, employee_code, first_name, last_name, work_email, employee_type, status, date_of_joining
    ) VALUES (
        1, 'EMP-TEST-MIG004', 'TestOverload', 'Employee', 'test.overload.migration004@peoplepay360.com', 'Full-time', 'Active', CURRENT_DATE
    ) RETURNING id INTO v_test_emp_id;

    -- Insert Draft contract covering today
    INSERT INTO contracts (
        employee_id, contract_number, wage_per_month, start_date, status, salary_structure_id
    ) VALUES (
        v_test_emp_id, 'CON/TEST/DRAFT/001', 5000.00, CURRENT_DATE - 30, 'Draft', 1
    ) RETURNING id INTO v_draft_contract_id;

    -- Insert Running contract covering today
    INSERT INTO contracts (
        employee_id, contract_number, wage_per_month, start_date, status, salary_structure_id
    ) VALUES (
        v_test_emp_id, 'CON/TEST/RUNNING/001', 6500.00, CURRENT_DATE - 30, 'Running', 1
    ) RETURNING id INTO v_running_contract_id;

    -- Call with 3 arguments directly (how application code invokes it)
    v_resolved_contract_id := get_applicable_contract(v_test_emp_id, CURRENT_DATE, CURRENT_DATE);

    IF v_resolved_contract_id <> v_running_contract_id THEN
        RAISE EXCEPTION 'Functional check failed: Expected Running contract ID %, got %', v_running_contract_id, v_resolved_contract_id;
    END IF;

    -- Cleanup test records
    DELETE FROM contracts WHERE id IN (v_draft_contract_id, v_running_contract_id);
    DELETE FROM employees WHERE id = v_test_emp_id;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'MIGRATION 004 VERIFICATION PASSED: Single overload confirmed.';
    RAISE NOTICE '------------------------------------------------------------';
END $$;
