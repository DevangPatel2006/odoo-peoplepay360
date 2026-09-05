-- =============================================================================
-- PeoplePay360: Dashboard Reporting VIEWs
-- Live Cross-Module Aggregations (No Hardcoded Numbers)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 VIEW: v_kpi_summary
-- Executive overview KPIs for payroll, attendance health, and leave metrics.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_kpi_summary AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    COALESCE(SUM(p.net_amount), 0.00) AS total_net_salary_paid,
    COUNT(p.id) AS total_payslips_generated,
    COUNT(CASE WHEN p.status = 'Paid' THEN 1 END) AS paid_payslips_count,
    COUNT(CASE WHEN p.status IN ('Draft', 'Computed', 'Done') THEN 1 END) AS pending_payslips_count,
    COALESCE(ROUND(AVG(p.net_amount), 2), 0.00) AS average_salary_per_employee,
    (
        SELECT COALESCE(SUM(duration), 0.00) 
        FROM time_off_requests tr 
        JOIN employees e ON tr.employee_id = e.id 
        WHERE e.company_id = c.id AND tr.status = 'Approved'
    ) AS total_approved_time_off_days,
    (
        SELECT COALESCE(ROUND(
            (COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 2
        ), 0.00)
        FROM attendances a
        JOIN employees e ON a.employee_id = e.id
        WHERE e.company_id = c.id
    ) AS attendance_health_percentage
FROM companies c
LEFT JOIN payruns pr ON pr.company_id = c.id
LEFT JOIN payslips p ON p.payrun_id = pr.id
GROUP BY c.id, c.name;

-- -----------------------------------------------------------------------------
-- 5.2 VIEW: v_salary_cost_by_department
-- Department-level salary breakdown filterable by payrun/period.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_salary_cost_by_department AS
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    d.company_id,
    p.payrun_id,
    p.period_start,
    p.period_end,
    COUNT(p.id) AS employee_count,
    COALESCE(SUM(p.basic_amount), 0.00) AS total_basic_amount,
    COALESCE(SUM(p.gross_amount), 0.00) AS total_gross_amount,
    COALESCE(SUM(p.net_amount), 0.00) AS total_net_amount
FROM departments d
JOIN employees e ON e.department_id = d.id
JOIN payslips p ON p.employee_id = e.id
GROUP BY d.id, d.name, d.company_id, p.payrun_id, p.period_start, p.period_end;

-- -----------------------------------------------------------------------------
-- 5.3 VIEW: v_monthly_net_salary_trend
-- Monthly aggregated payroll trends over time.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_monthly_net_salary_trend AS
SELECT 
    pr.company_id,
    TO_CHAR(p.period_start, 'YYYY-MM') AS pay_month,
    COUNT(DISTINCT p.id) AS payslips_count,
    COALESCE(SUM(p.gross_amount), 0.00) AS total_gross_salary,
    COALESCE(SUM(p.net_amount), 0.00) AS total_net_salary
FROM payruns pr
JOIN payslips p ON p.payrun_id = pr.id
WHERE pr.is_archived = false
GROUP BY pr.company_id, TO_CHAR(p.period_start, 'YYYY-MM')
ORDER BY pay_month DESC;

-- -----------------------------------------------------------------------------
-- 5.4 VIEW: v_payslip_status_and_alerts
-- Payslip status distributions + Live Unresolved Warnings Feed.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_payslip_status_and_alerts AS
SELECT 
    p.payrun_id,
    p.status AS payslip_status,
    COUNT(p.id) AS payslip_count,
    COUNT(pw.id) AS warning_count,
    STRING_AGG(DISTINCT pw.warning_type, ', ') AS warning_types
FROM payslips p
LEFT JOIN payroll_warnings pw ON pw.payslip_id = p.id AND pw.is_resolved = false
GROUP BY p.payrun_id, p.status;

-- -----------------------------------------------------------------------------
-- 5.5 VIEW: v_attendance_overview
-- Attendance health metrics, worked/overtime hours, and manual correction counts.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_attendance_overview AS
SELECT 
    e.company_id,
    e.department_id,
    d.name AS department_name,
    COUNT(a.id) AS total_attendance_records,
    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN a.status = 'Late' THEN 1 END) AS late_count,
    COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN a.status = 'On Leave' THEN 1 END) AS on_leave_count,
    COUNT(CASE WHEN a.is_manual_correction THEN 1 END) AS manual_corrections_count,
    COALESCE(SUM(a.worked_hours), 0.00) AS total_worked_hours,
    COALESCE(SUM(a.overtime_hours), 0.00) AS total_overtime_hours,
    ROUND(
        (COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 2
    ) AS coverage_percentage
FROM attendances a
JOIN employees e ON a.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
GROUP BY e.company_id, e.department_id, d.name;

-- -----------------------------------------------------------------------------
-- 5.6 VIEW: v_time_off_overview
-- Leave usage per Time Off Type: requested, approved, pending, and remaining.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_time_off_overview AS
SELECT 
    tot.id AS time_off_type_id,
    tot.name AS time_off_type_name,
    tot.unit,
    COUNT(tr.id) AS total_requests_count,
    COALESCE(SUM(CASE WHEN tr.status = 'Approved' THEN tr.duration ELSE 0 END), 0.00) AS approved_amount,
    COALESCE(SUM(CASE WHEN tr.status = 'To Approve' THEN tr.duration ELSE 0 END), 0.00) AS pending_amount,
    COALESCE(SUM(ta.allocated_amount), 0.00) AS total_allocated,
    COALESCE(SUM(ta.remaining_amount), 0.00) AS total_remaining
FROM time_off_types tot
LEFT JOIN time_off_requests tr ON tr.time_off_type_id = tot.id
LEFT JOIN time_off_allocations ta ON ta.time_off_type_id = tot.id
GROUP BY tot.id, tot.name, tot.unit;

-- -----------------------------------------------------------------------------
-- 5.7 VIEW: v_department_overview
-- Headcount + Total active monthly wage per department.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_department_overview AS
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    c.name AS company_name,
    COUNT(DISTINCT e.id) AS headcount,
    COALESCE(SUM(cnt.wage_per_month), 0.00) AS total_monthly_committed_salary
FROM departments d
JOIN companies c ON d.company_id = c.id
LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'Active'
LEFT JOIN contracts cnt ON cnt.employee_id = e.id AND cnt.status = 'Running'
GROUP BY d.id, d.name, c.name;
