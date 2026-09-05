-- =============================================================================
-- PeoplePay360: Production-Grade PostgreSQL Database Schema
-- Enterprise HR & Payroll Platform
-- =============================================================================

-- Drop tables if re-running script (in reverse dependency order)
DROP TABLE IF EXISTS payroll_warnings CASCADE;
DROP TABLE IF EXISTS payslip_lines CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS payrun_employees CASCADE;
DROP TABLE IF EXISTS payruns CASCADE;
DROP TABLE IF EXISTS salary_rules CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS time_off_requests CASCADE;
DROP TABLE IF EXISTS time_off_allocations CASCADE;
DROP TABLE IF EXISTS time_off_types CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS working_schedule_lines CASCADE;
DROP TABLE IF EXISTS working_schedules CASCADE;
DROP TABLE IF EXISTS job_positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- -----------------------------------------------------------------------------
-- 2.1 COMPANIES
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency_code VARCHAR(10) DEFAULT 'USD' NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC' NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.2 DEPARTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    manager_employee_id INT, -- Foreign key added via ALTER after employees table created
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.3 JOB POSITIONS
-- -----------------------------------------------------------------------------
CREATE TABLE job_positions (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.4 ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.5 ROLE PERMISSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL CHECK (
        module IN (
            'Employees', 'Contracts', 'Attendance', 'TimeOff', 
            'Payruns', 'Payslips', 'SalaryStructures', 'SalaryRules', 'Users'
        )
    ),
    can_create BOOLEAN DEFAULT false NOT NULL,
    can_read BOOLEAN DEFAULT false NOT NULL,
    can_update BOOLEAN DEFAULT false NOT NULL,
    can_delete BOOLEAN DEFAULT false NOT NULL,
    can_approve BOOLEAN DEFAULT false NOT NULL,
    CONSTRAINT uk_role_permission_module UNIQUE (role_id, module)
);

-- -----------------------------------------------------------------------------
-- 2.9 WORKING SCHEDULES
-- -----------------------------------------------------------------------------
CREATE TABLE working_schedules (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    calendar_type VARCHAR(50) DEFAULT 'Standard' NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC' NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.9a WORKING SCHEDULE LINES
-- -----------------------------------------------------------------------------
CREATE TABLE working_schedule_lines (
    id SERIAL PRIMARY KEY,
    working_schedule_id INT NOT NULL REFERENCES working_schedules(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (
        day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    ),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0 NOT NULL CHECK (break_minutes >= 0),
    computed_hours NUMERIC(5,2) GENERATED ALWAYS AS (
        ROUND(
            (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) - (break_minutes / 60.0), 2
        )
    ) STORED,
    CONSTRAINT uk_schedule_day UNIQUE (working_schedule_id, day_of_week)
);

-- -----------------------------------------------------------------------------
-- 2.6 EMPLOYEES
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    work_email VARCHAR(255) UNIQUE NOT NULL,
    personal_phone VARCHAR(50),
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    job_position_id INT REFERENCES job_positions(id) ON DELETE SET NULL,
    manager_id INT REFERENCES employees(id) ON DELETE SET NULL,
    working_schedule_id INT REFERENCES working_schedules(id) ON DELETE SET NULL,
    work_location VARCHAR(255),
    employee_type VARCHAR(50) NOT NULL CHECK (employee_type IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
    status VARCHAR(20) DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive', 'Archived')),
    date_of_joining DATE NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    bank_account_number VARCHAR(100),
    bank_ifsc_or_swift VARCHAR(50),
    bank_name VARCHAR(150),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add deferred foreign key constraint to departments for manager_employee_id
ALTER TABLE departments 
    ADD CONSTRAINT fk_dept_manager 
    FOREIGN KEY (manager_employee_id) 
    REFERENCES employees(id) 
    ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 2.7 USERS (Login Accounts)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
    work_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.8 USER ROLES (Multi-role Junction Table)
-- -----------------------------------------------------------------------------
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_user_role UNIQUE (user_id, role_id)
);

-- -----------------------------------------------------------------------------
-- 2.15 SALARY STRUCTURES
-- -----------------------------------------------------------------------------
CREATE TABLE salary_structures (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    structure_type VARCHAR(50) DEFAULT 'Regular' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.10 CONTRACTS
-- -----------------------------------------------------------------------------
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    job_position_id INT REFERENCES job_positions(id) ON DELETE SET NULL,
    working_schedule_id INT REFERENCES working_schedules(id) ON DELETE SET NULL,
    salary_structure_id INT REFERENCES salary_structures(id) ON DELETE SET NULL,
    wage_per_month NUMERIC(12,2) NOT NULL CHECK (wage_per_month >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'Running', 'Expired', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Rule #1 Enforcement: Only one Running contract per employee at a time
CREATE UNIQUE INDEX idx_unique_running_contract 
    ON contracts (employee_id) 
    WHERE status = 'Running';

-- Performance Index for period-applicable contract resolution
CREATE INDEX idx_contracts_employee_dates 
    ON contracts (employee_id, start_date, end_date);

-- -----------------------------------------------------------------------------
-- 2.11 ATTENDANCES
-- -----------------------------------------------------------------------------
CREATE TABLE attendances (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    worked_hours NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN check_in_at IS NOT NULL AND check_out_at IS NOT NULL AND check_out_at > check_in_at
            THEN ROUND((EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 3600.0)::numeric, 2)
            ELSE 0.00
        END
    ) STORED,
    overtime_hours NUMERIC(5,2) DEFAULT 0.00 NOT NULL CHECK (overtime_hours >= 0),
    status VARCHAR(20) DEFAULT 'Present' NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'On Leave')),
    is_manual_correction BOOLEAN DEFAULT false NOT NULL,
    corrected_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

-- -----------------------------------------------------------------------------
-- 2.12 TIME OFF TYPES
-- -----------------------------------------------------------------------------
CREATE TABLE time_off_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    unit VARCHAR(10) DEFAULT 'Days' NOT NULL CHECK (unit IN ('Days', 'Hours')),
    requires_allocation BOOLEAN DEFAULT true NOT NULL,
    approval_level VARCHAR(20) DEFAULT 'Manager' NOT NULL CHECK (approval_level IN ('Manager', 'Officer', 'None')),
    affects_payroll BOOLEAN DEFAULT true NOT NULL,
    display_color VARCHAR(20) DEFAULT '#3B82F6' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    configuration_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.13 TIME OFF ALLOCATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE time_off_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id INT NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(6,2) NOT NULL CHECK (allocated_amount >= 0),
    taken_amount NUMERIC(6,2) DEFAULT 0.00 NOT NULL CHECK (taken_amount >= 0),
    remaining_amount NUMERIC(6,2) GENERATED ALWAYS AS (allocated_amount - taken_amount) STORED,
    status VARCHAR(20) DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'To Approve', 'Approved', 'Refused')),
    approver_id INT REFERENCES employees(id) ON DELETE SET NULL,
    validity_start DATE NOT NULL,
    validity_end DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_allocation_validity CHECK (validity_end >= validity_start)
);

-- -----------------------------------------------------------------------------
-- 2.14 TIME OFF REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE time_off_requests (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id INT NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration NUMERIC(6,2) NOT NULL CHECK (duration > 0),
    status VARCHAR(20) DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'To Approve', 'Approved', 'Refused')),
    approver_id INT REFERENCES employees(id) ON DELETE SET NULL,
    allocation_id INT REFERENCES time_off_allocations(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_request_dates CHECK (end_date >= start_date)
);

-- -----------------------------------------------------------------------------
-- 2.16 SALARY RULES
-- -----------------------------------------------------------------------------
CREATE TABLE salary_rules (
    id SERIAL PRIMARY KEY,
    salary_structure_id INT NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Basic', 'Allowance', 'Gross', 'Deduction', 'Net')),
    sequence INT DEFAULT 10 NOT NULL,
    computation_method VARCHAR(20) NOT NULL CHECK (computation_method IN ('Fixed', 'Percentage', 'Formula')),
    fixed_amount NUMERIC(12,2),
    percentage_value NUMERIC(5,2),
    percentage_base VARCHAR(20) CHECK (percentage_base IN ('Wage', 'Basic', 'Gross', 'Custom')),
    formula_expression TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_structure_rule_code UNIQUE (salary_structure_id, code)
);

CREATE INDEX idx_salary_rules_seq ON salary_rules (salary_structure_id, sequence);

-- -----------------------------------------------------------------------------
-- 2.17 PAYRUNS
-- -----------------------------------------------------------------------------
CREATE TABLE payruns (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    salary_structure_id INT NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    employee_type_filter VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'Computed', 'Validated', 'Paid')),
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_payrun_period CHECK (period_end >= period_start)
);

-- -----------------------------------------------------------------------------
-- 2.18 PAYRUN EMPLOYEES (Step-2 Explicit Selection Junction)
-- -----------------------------------------------------------------------------
CREATE TABLE payrun_employees (
    id SERIAL PRIMARY KEY,
    payrun_id INT NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    resolved_contract_id INT NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_payrun_employee UNIQUE (payrun_id, employee_id)
);

-- -----------------------------------------------------------------------------
-- 2.19 PAYSLIPS
-- -----------------------------------------------------------------------------
CREATE TABLE payslips (
    id SERIAL PRIMARY KEY,
    payrun_id INT NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_id INT NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
    salary_structure_id INT NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    worked_days NUMERIC(5,2) DEFAULT 0 NOT NULL,
    basic_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    gross_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    net_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'Computed', 'Done', 'Paid')),
    is_archived BOOLEAN DEFAULT false NOT NULL,
    pdf_file_path TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_payrun_employee_payslip UNIQUE (payrun_id, employee_id),
    CONSTRAINT chk_payslip_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_payslips_emp_period ON payslips (employee_id, period_start, period_end);

-- -----------------------------------------------------------------------------
-- 2.20 PAYSLIP LINES (Rule-by-rule Breakdown)
-- -----------------------------------------------------------------------------
CREATE TABLE payslip_lines (
    id SERIAL PRIMARY KEY,
    payslip_id INT NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    salary_rule_id INT REFERENCES salary_rules(id) ON DELETE SET NULL,
    rule_name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sequence INT NOT NULL,
    computed_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2.21 PAYROLL WARNINGS
-- -----------------------------------------------------------------------------
CREATE TABLE payroll_warnings (
    id SERIAL PRIMARY KEY,
    payslip_id INT REFERENCES payslips(id) ON DELETE CASCADE,
    contract_id INT REFERENCES contracts(id) ON DELETE CASCADE,
    warning_type VARCHAR(50) NOT NULL CHECK (
        warning_type IN ('MissingBankDetails', 'DuplicatePayslip', 'ContractExpiringSoon', 'Other')
    ),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
