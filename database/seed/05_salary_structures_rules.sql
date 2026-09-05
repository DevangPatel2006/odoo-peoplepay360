-- =============================================================================
-- Seed 05: Salary Structures & Rules
-- At least 2 structures ("Regular Salary", "Intern Salary") with rules in sequence order:
-- Basic(10) -> HRA(20) -> Standard Allowance(30) -> Performance Bonus(40) -> 
-- LTA(50) -> Fixed Allowance(60) -> Gross Salary(70) -> LWF(80) -> PF(90) -> 
-- ESIC(100) -> Professional Tax(110) -> Net Salary(120)
-- =============================================================================

INSERT INTO salary_structures (id, company_id, name, structure_type, is_active) VALUES
(1, 1, 'Regular Salary Structure', 'Regular', true),
(2, 1, 'Intern Salary Structure', 'Intern', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('salary_structures_id_seq', (SELECT MAX(id) FROM salary_structures));

-- -----------------------------------------------------------------------------
-- SALARY RULES FOR REGULAR SALARY STRUCTURE (ID 1)
-- -----------------------------------------------------------------------------
INSERT INTO salary_rules (
    salary_structure_id, name, code, category, sequence, computation_method, 
    fixed_amount, percentage_value, percentage_base, formula_expression
) VALUES
(1, 'Basic Salary', 'BASIC', 'Basic', 10, 'Percentage', NULL, 50.00, 'Wage', NULL),
(1, 'House Rent Allowance', 'HRA', 'Allowance', 20, 'Percentage', NULL, 40.00, 'Basic', NULL),
(1, 'Standard Allowance', 'STD_ALLOW', 'Allowance', 30, 'Fixed', 2500.00, NULL, NULL, NULL),
(1, 'Performance Bonus', 'BONUS', 'Allowance', 40, 'Fixed', 1500.00, NULL, NULL, NULL),
(1, 'Leave Travel Allowance', 'LTA', 'Allowance', 50, 'Fixed', 1000.00, NULL, NULL, NULL),
(1, 'Fixed Allowance', 'FIXED_ALLOW', 'Allowance', 60, 'Fixed', 800.00, NULL, NULL, NULL),
(1, 'Gross Salary', 'GROSS', 'Gross', 70, 'Formula', NULL, NULL, NULL, 'result = categories["BASIC"] + categories["ALLOWANCE"]'),
(1, 'Labor Welfare Fund', 'LWF', 'Deduction', 80, 'Fixed', 20.00, NULL, NULL, NULL),
(1, 'Provident Fund', 'PF', 'Deduction', 90, 'Percentage', NULL, 12.00, 'Basic', NULL),
(1, 'Employee State Insurance', 'ESIC', 'Deduction', 100, 'Percentage', NULL, 0.75, 'Gross', NULL),
(1, 'Professional Tax', 'PT', 'Deduction', 110, 'Fixed', 200.00, NULL, NULL, NULL),
(1, 'Net Salary', 'NET', 'Net', 120, 'Formula', NULL, NULL, NULL, 'result = categories["GROSS"] - categories["DEDUCTION"]')
ON CONFLICT (salary_structure_id, code) DO UPDATE SET 
name = EXCLUDED.name, category = EXCLUDED.category, sequence = EXCLUDED.sequence, computation_method = EXCLUDED.computation_method;

-- -----------------------------------------------------------------------------
-- SALARY RULES FOR INTERN SALARY STRUCTURE (ID 2)
-- -----------------------------------------------------------------------------
INSERT INTO salary_rules (
    salary_structure_id, name, code, category, sequence, computation_method, 
    fixed_amount, percentage_value, percentage_base, formula_expression
) VALUES
(2, 'Stipend Basic', 'BASIC', 'Basic', 10, 'Percentage', NULL, 100.00, 'Wage', NULL),
(2, 'Gross Stipend', 'GROSS', 'Gross', 70, 'Formula', NULL, NULL, NULL, 'result = categories["BASIC"]'),
(2, 'Net Stipend', 'NET', 'Net', 120, 'Formula', NULL, NULL, NULL, 'result = categories["GROSS"]')
ON CONFLICT (salary_structure_id, code) DO UPDATE SET 
name = EXCLUDED.name, category = EXCLUDED.category, sequence = EXCLUDED.sequence, computation_method = EXCLUDED.computation_method;
