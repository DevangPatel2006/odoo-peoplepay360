-- =============================================================================
-- PeoplePay360 Migration 002: Hardening Fixes
-- Production Security, Integrity, and Workflow Hardening
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FIX 1 — Add a status-guard trigger to payslips
-- Enforces forward-only status transitions: Draft -> Computed -> Done -> Paid
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_guard_payslip_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'Paid' AND NEW.status <> 'Paid' THEN
        RAISE EXCEPTION 'Cannot revert status of a Paid payslip (ID %). Finalized payslips are locked.', OLD.id;
    END IF;
    IF OLD.status = 'Done' AND NEW.status IN ('Draft', 'Computed') THEN
        RAISE EXCEPTION 'Cannot revert Done payslip (ID %) back to %', OLD.id, NEW.status;
    END IF;
    IF OLD.status = 'Computed' AND NEW.status = 'Draft' THEN
        RAISE EXCEPTION 'Cannot revert Computed payslip (ID %) back to Draft', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payslip_status_guard ON payslips;
CREATE TRIGGER trg_payslip_status_guard
BEFORE UPDATE OF status ON payslips
FOR EACH ROW
EXECUTE FUNCTION fn_guard_payslip_status_transition();

-- -----------------------------------------------------------------------------
-- FIX 2 — Block hard deletion of finalized payroll
-- Prevents hard DELETE on Validated/Paid payruns and Paid payslips
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_finalized_payrun_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('Validated', 'Paid') THEN
        RAISE EXCEPTION 'Cannot delete payrun ID % with status %. Set is_archived = true instead.', OLD.id, OLD.status;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_finalized_payrun_delete ON payruns;
CREATE TRIGGER trg_prevent_finalized_payrun_delete
BEFORE DELETE ON payruns
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_finalized_payrun_delete();

CREATE OR REPLACE FUNCTION fn_prevent_paid_payslip_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'Paid' THEN
        RAISE EXCEPTION 'Cannot delete Paid payslip ID %. Set is_archived = true instead.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_paid_payslip_delete ON payslips;
CREATE TRIGGER trg_prevent_paid_payslip_delete
BEFORE DELETE ON payslips
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_paid_payslip_delete();

-- -----------------------------------------------------------------------------
-- FIX 3 — refresh_payroll_warnings() only clears unresolved warnings
-- Preserves warnings marked is_resolved = true
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

    -- 1. Check Missing Bank Details
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
-- FIX 4 — get_applicable_contract() filter out Draft contracts
-- Only matches Running contracts by default; optional p_include_expired param
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- FIX 5 — Require salary_structure_id for Running contracts
-- -----------------------------------------------------------------------------
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS chk_running_contract_has_structure;
ALTER TABLE contracts
    ADD CONSTRAINT chk_running_contract_has_structure
    CHECK (status <> 'Running' OR salary_structure_id IS NOT NULL);

-- -----------------------------------------------------------------------------
-- FIX 6 — Generic updated_at auto-touch trigger attached to all tables
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_touch_updated_at ON %I; 
             CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON %I 
             FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();',
            t, t
        );
    END LOOP;
END $$;

-- =============================================================================
-- VERIFICATION BLOCK: Validates Fixes 1 through 6
-- =============================================================================
DO $$
DECLARE
    v_test_emp_id INT;
    v_test_contract_id INT;
    v_test_payrun_id INT;
    v_test_payslip_id INT;
    v_warning_id INT;
    v_resolved_count INT;
    v_old_updated_at TIMESTAMPTZ;
    v_new_updated_at TIMESTAMPTZ;
    v_error_caught BOOLEAN;
BEGIN
    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'STARTING MIGRATION 002 HARDENING FIXES VERIFICATION CHECKS';
    RAISE NOTICE '------------------------------------------------------------';

    -- Setup temp test records
    INSERT INTO employees (company_id, employee_code, first_name, last_name, work_email, employee_type, status, date_of_joining)
    VALUES (1, 'EMP_TEST_MIG', 'Test', 'Verification', 'test.verification@peoplepay360.com', 'Full-time', 'Active', CURRENT_DATE)
    RETURNING id INTO v_test_emp_id;

    INSERT INTO contracts (contract_number, employee_id, salary_structure_id, wage_per_month, start_date, status)
    VALUES ('CON_TEST_MIG', v_test_emp_id, 1, 5000.00, CURRENT_DATE - 30, 'Draft')
    RETURNING id INTO v_test_contract_id;

    INSERT INTO payruns (company_id, name, salary_structure_id, period_start, period_end, status)
    VALUES (1, 'Test Payrun Migration', 1, CURRENT_DATE - 30, CURRENT_DATE, 'Paid')
    RETURNING id INTO v_test_payrun_id;

    INSERT INTO payslips (payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, status)
    VALUES (v_test_payrun_id, v_test_emp_id, v_test_contract_id, 1, CURRENT_DATE - 30, CURRENT_DATE, 'Paid')
    RETURNING id INTO v_test_payslip_id;

    -- -------------------------------------------------------------------------
    -- Check 1: Payslip Status Reversion Guard
    -- -------------------------------------------------------------------------
    v_error_caught := false;
    BEGIN
        UPDATE payslips SET status = 'Draft' WHERE id = v_test_payslip_id;
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
        RAISE NOTICE '✅ Fix 1 Verified: Payslip status reversion Paid -> Draft correctly blocked with error: %', SQLERRM;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION '❌ Fix 1 Failed: Paid payslip status was allowed to revert to Draft!';
    END IF;

    -- -------------------------------------------------------------------------
    -- Check 2: Finalized Payroll Hard-Delete Guard
    -- -------------------------------------------------------------------------
    v_error_caught := false;
    BEGIN
        DELETE FROM payruns WHERE id = v_test_payrun_id;
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
        RAISE NOTICE '✅ Fix 2 Verified: Hard deletion of Paid payrun correctly blocked with error: %', SQLERRM;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION '❌ Fix 2 Failed: Paid payrun hard deletion was permitted!';
    END IF;

    -- Archive test (allowed alternative)
    UPDATE payruns SET is_archived = true WHERE id = v_test_payrun_id;
    RAISE NOTICE '✅ Fix 2 Alternative Verified: Archiving (is_archived = true) succeeded for Paid payrun.';

    -- -------------------------------------------------------------------------
    -- Check 3: Preserving Resolved Warnings during refresh_payroll_warnings()
    -- -------------------------------------------------------------------------
    INSERT INTO payroll_warnings (payslip_id, warning_type, message, is_resolved)
    VALUES (v_test_payslip_id, 'Other', 'Test Resolved Warning', true)
    RETURNING id INTO v_warning_id;

    PERFORM refresh_payroll_warnings(v_test_payrun_id);

    SELECT COUNT(*) INTO v_resolved_count 
    FROM payroll_warnings 
    WHERE id = v_warning_id AND is_resolved = true;

    IF v_resolved_count = 1 THEN
        RAISE NOTICE '✅ Fix 3 Verified: refresh_payroll_warnings() preserved is_resolved = true warning ID %.', v_warning_id;
    ELSE
        RAISE EXCEPTION '❌ Fix 3 Failed: Resolved warning was wiped by refresh_payroll_warnings()!';
    END IF;

    -- -------------------------------------------------------------------------
    -- Check 4: get_applicable_contract() Ignores Draft Contracts
    -- -------------------------------------------------------------------------
    v_error_caught := false;
    BEGIN
        PERFORM get_applicable_contract(v_test_emp_id, CURRENT_DATE - 30, CURRENT_DATE);
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
        RAISE NOTICE '✅ Fix 4 Verified: get_applicable_contract() correctly ignored Draft contract with error: %', SQLERRM;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION '❌ Fix 4 Failed: get_applicable_contract() matched a Draft contract!';
    END IF;

    -- -------------------------------------------------------------------------
    -- Check 5: Running Contract Structure Requirement
    -- -------------------------------------------------------------------------
    v_error_caught := false;
    BEGIN
        UPDATE contracts SET salary_structure_id = NULL, status = 'Running' WHERE id = v_test_contract_id;
    EXCEPTION WHEN OTHERS THEN
        v_error_caught := true;
        RAISE NOTICE '✅ Fix 5 Verified: Setting status = Running with salary_structure_id = NULL correctly blocked with check constraint error: %', SQLERRM;
    END;
    IF NOT v_error_caught THEN
        RAISE EXCEPTION '❌ Fix 5 Failed: Running contract allowed NULL salary_structure_id!';
    END IF;

    -- -------------------------------------------------------------------------
    -- Check 6: Touch updated_at Trigger
    -- -------------------------------------------------------------------------
    SELECT updated_at INTO v_old_updated_at FROM employees WHERE id = v_test_emp_id;
    PERFORM pg_sleep(0.05); -- brief pause to ensure timestamp diff
    UPDATE employees SET first_name = 'UpdatedTest' WHERE id = v_test_emp_id;
    SELECT updated_at INTO v_new_updated_at FROM employees WHERE id = v_test_emp_id;

    IF v_new_updated_at > v_old_updated_at THEN
        RAISE NOTICE '✅ Fix 6 Verified: fn_touch_updated_at() automatically updated timestamp from % to %', v_old_updated_at, v_new_updated_at;
    ELSE
        RAISE EXCEPTION '❌ Fix 6 Failed: updated_at timestamp did not auto-update!';
    END IF;

    -- Cleanup test data
    ALTER TABLE payruns DISABLE TRIGGER trg_payrun_status_guard;
    ALTER TABLE payruns DISABLE TRIGGER trg_prevent_finalized_payrun_delete;
    ALTER TABLE payslips DISABLE TRIGGER trg_payslip_status_guard;
    ALTER TABLE payslips DISABLE TRIGGER trg_prevent_paid_payslip_delete;

    DELETE FROM payroll_warnings WHERE payslip_id = v_test_payslip_id;
    DELETE FROM payslips WHERE id = v_test_payslip_id;
    DELETE FROM payruns WHERE id = v_test_payrun_id;
    DELETE FROM contracts WHERE id = v_test_contract_id;
    DELETE FROM employees WHERE id = v_test_emp_id;

    ALTER TABLE payruns ENABLE TRIGGER trg_payrun_status_guard;
    ALTER TABLE payruns ENABLE TRIGGER trg_prevent_finalized_payrun_delete;
    ALTER TABLE payslips ENABLE TRIGGER trg_payslip_status_guard;
    ALTER TABLE payslips ENABLE TRIGGER trg_prevent_paid_payslip_delete;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'ALL MIGRATION 002 HARDENING CHECKS PASSED SUCCESSFULLY! ✅';
    RAISE NOTICE '------------------------------------------------------------';
END $$;
