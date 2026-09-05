-- =============================================================================
-- PeoplePay360: Stored Functions & Triggers
-- Business-Logic Enforcement & Engine Functions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.1 FUNCTION: get_applicable_contract
-- Resolves the exact contract covering the specified payroll period for an employee.
-- Guards Rule #2: Never just picks "the latest contract".
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_applicable_contract(
    p_employee_id INT,
    p_period_start DATE,
    p_period_end DATE
) RETURNS INT AS $$
DECLARE
    v_contract_id INT;
    v_count INT;
BEGIN
    SELECT COUNT(*), MAX(id)
    INTO v_count, v_contract_id
    FROM contracts
    WHERE employee_id = p_employee_id
      AND status = 'Running'
      AND start_date <= p_period_end
      AND (end_date IS NULL OR end_date >= p_period_start);

    IF v_count = 0 THEN
        RAISE EXCEPTION 'No running active contract found for employee ID % covering period % to %', 
            p_employee_id, p_period_start, p_period_end;
    ELSIF v_count > 1 THEN
        RAISE EXCEPTION 'Ambiguous contracts: % matching contracts found for employee ID % covering period % to %', 
            v_count, p_employee_id, p_period_start, p_period_end;
    END IF;

    RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4.2 TRIGGER: Time Off Allocation Deductions
-- On Approved request, increment taken_amount on the linked allocation (Rule #4).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_deduct_time_off_allocation()
RETURNS TRIGGER AS $$
DECLARE
    v_requires_allocation BOOLEAN;
BEGIN
    -- Check if time off type requires allocation
    SELECT requires_allocation INTO v_requires_allocation
    FROM time_off_types
    WHERE id = NEW.time_off_type_id;

    IF NEW.status = 'Approved' AND (OLD.status IS NULL OR OLD.status <> 'Approved') THEN
        IF v_requires_allocation THEN
            IF NEW.allocation_id IS NULL THEN
                RAISE EXCEPTION 'Time off type requires an allocation, but no allocation_id was provided on request ID %', NEW.id;
            END IF;

            UPDATE time_off_allocations
            SET taken_amount = taken_amount + NEW.duration,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.allocation_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_time_off_request_approved ON time_off_requests;
CREATE TRIGGER trg_time_off_request_approved
AFTER UPDATE OF status ON time_off_requests
FOR EACH ROW
EXECUTE FUNCTION fn_deduct_time_off_allocation();

-- -----------------------------------------------------------------------------
-- 4.3 TRIGGER: Forward-Only Status Transition Guard (Payruns & Payslips)
-- Rule #8: Status must move forward only: Draft -> Computed -> Validated -> Paid
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_guard_payrun_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'Paid' AND NEW.status <> 'Paid' THEN
        RAISE EXCEPTION 'Cannot revert status of a Paid payrun (ID %). Finalized payroll is locked.', OLD.id;
    END IF;
    IF OLD.status = 'Validated' AND NEW.status IN ('Draft', 'Computed') THEN
        RAISE EXCEPTION 'Cannot revert Validated payrun (ID %) back to %', OLD.id, NEW.status;
    END IF;
    IF OLD.status = 'Computed' AND NEW.status = 'Draft' THEN
        RAISE EXCEPTION 'Cannot revert Computed payrun (ID %) back to Draft', OLD.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payrun_status_guard ON payruns;
CREATE TRIGGER trg_payrun_status_guard
BEFORE UPDATE OF status ON payruns
FOR EACH ROW
EXECUTE FUNCTION fn_guard_payrun_status_transition();

-- -----------------------------------------------------------------------------
-- 4.4 FUNCTION: compute_payslip
-- Evaluates salary rules sequentially (Rule #7) for a single payslip.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_payslip(p_payslip_id INT)
RETURNS VOID AS $$
DECLARE
    v_payslip RECORD;
    v_contract RECORD;
    v_rule RECORD;
    v_computed_val NUMERIC(12,2);
    v_basic NUMERIC(12,2) := 0.00;
    v_gross NUMERIC(12,2) := 0.00;
    v_net NUMERIC(12,2) := 0.00;
    v_wage NUMERIC(12,2) := 0.00;
BEGIN
    -- Fetch Payslip
    SELECT * INTO v_payslip FROM payslips WHERE id = p_payslip_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payslip ID % not found', p_payslip_id;
    END IF;

    -- Fetch Contract wage
    SELECT wage_per_month INTO v_wage FROM contracts WHERE id = v_payslip.contract_id;
    IF v_wage IS NULL THEN
        v_wage := 0.00;
    END IF;

    -- Clear existing computed lines for this payslip
    DELETE FROM payslip_lines WHERE payslip_id = p_payslip_id;

    -- Evaluate rules in sequence order
    FOR v_rule IN 
        SELECT * FROM salary_rules 
        WHERE salary_structure_id = v_payslip.salary_structure_id 
          AND is_active = true 
        ORDER BY sequence ASC
    LOOP
        v_computed_val := 0.00;

        IF v_rule.computation_method = 'Fixed' THEN
            v_computed_val := COALESCE(v_rule.fixed_amount, 0.00);
        ELSIF v_rule.computation_method = 'Percentage' THEN
            IF v_rule.percentage_base = 'Wage' THEN
                v_computed_val := ROUND(v_wage * (COALESCE(v_rule.percentage_value, 0) / 100.0), 2);
            ELSIF v_rule.percentage_base = 'Basic' THEN
                v_computed_val := ROUND(v_basic * (COALESCE(v_rule.percentage_value, 0) / 100.0), 2);
            ELSIF v_rule.percentage_base = 'Gross' THEN
                v_computed_val := ROUND(v_gross * (COALESCE(v_rule.percentage_value, 0) / 100.0), 2);
            ELSE
                v_computed_val := ROUND(v_wage * (COALESCE(v_rule.percentage_value, 0) / 100.0), 2);
            END IF;
        ELSIF v_rule.computation_method = 'Formula' THEN
            IF v_rule.category = 'Gross' THEN
                v_computed_val := v_gross;
            ELSIF v_rule.category = 'Net' THEN
                v_computed_val := v_net;
            ELSE
                v_computed_val := COALESCE(v_rule.fixed_amount, 0.00);
            END IF;
        END IF;

        -- Accumulate category totals
        IF v_rule.category = 'Basic' THEN
            v_basic := v_basic + v_computed_val;
            v_gross := v_gross + v_computed_val;
        ELSIF v_rule.category = 'Allowance' THEN
            v_gross := v_gross + v_computed_val;
        ELSIF v_rule.category = 'Gross' THEN
            v_computed_val := v_gross;
            v_net := v_gross;
        ELSIF v_rule.category = 'Deduction' THEN
            v_net := v_net - v_computed_val;
        ELSIF v_rule.category = 'Net' THEN
            v_computed_val := GREATEST(v_net, 0.00);
        END IF;

        -- Insert Line Breakdown
        INSERT INTO payslip_lines (
            payslip_id, salary_rule_id, rule_name, code, category, sequence, computed_amount
        ) VALUES (
            p_payslip_id, v_rule.id, v_rule.name, v_rule.code, v_rule.category, v_rule.sequence, v_computed_val
        );
    END LOOP;

    -- Update parent payslip rollups
    UPDATE payslips
    SET basic_amount = v_basic,
        gross_amount = v_gross,
        net_amount = GREATEST(v_net, 0.00),
        status = 'Computed',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payslip_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4.5 FUNCTION: refresh_payroll_warnings
-- Populates payroll_warnings for missing bank details, duplicate payslips, and contract expirations.
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

    -- Clear existing unresolved warnings for this payrun's payslips
    DELETE FROM payroll_warnings 
    WHERE payslip_id IN (SELECT id FROM payslips WHERE payrun_id = p_payrun_id);

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
            FORMAT('Employee %s %s (ID %) is missing bank account details.', v_payslip.first_name, v_payslip.last_name, v_payslip.employee_id)
        );
        v_warning_count := v_warning_count + 1;
    END LOOP;

    -- 2. Check Duplicate Payslips (Same employee with overlapping period in another payrun)
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

    -- 3. Check Expiring Contracts (Contracts ending within 30 days of period_end)
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
