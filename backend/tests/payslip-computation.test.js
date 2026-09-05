import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Payslip Computation Integration Tests', () => {
  let adminToken;
  let testStructureId;
  let testContractId;
  let testPayrunId;
  let testPayslipId;

  beforeAll(async () => {
    adminToken = await getAuthToken('admin@peoplepay360.com');

    // 1. Create dedicated test salary structure
    const structRes = await query(`
      INSERT INTO salary_structures (company_id, name, structure_type, is_active)
      VALUES (1, 'Test Math Structure', 'Test', true)
      RETURNING id
    `);
    testStructureId = structRes.rows[0].id;

    // 2. Insert test rules: Basic (Fixed), Allowance (Percentage of Basic), Gross (Formula), Deduction (Fixed), Net (Formula)
    await query(`
      INSERT INTO salary_rules (salary_structure_id, name, code, category, sequence, computation_method, fixed_amount, percentage_value, percentage_base, formula_expression)
      VALUES 
      ($1, 'Basic Salary', 'BASIC', 'Basic', 10, 'Fixed', 5000.00, NULL, NULL, NULL),
      ($1, 'House Rent Allowance', 'HRA', 'Allowance', 20, 'Percentage', NULL, 20.00, 'Basic', NULL),
      ($1, 'Gross Salary', 'GROSS', 'Gross', 70, 'Formula', NULL, NULL, NULL, 'result = categories["BASIC"] + categories["ALLOWANCE"]'),
      ($1, 'Standard Deduction', 'STD_DED', 'Deduction', 80, 'Fixed', 500.00, NULL, NULL, NULL),
      ($1, 'Net Salary', 'NET', 'Net', 120, 'Formula', NULL, NULL, NULL, 'result = categories["GROSS"] - categories["DEDUCTION"]')
    `, [testStructureId]);

    // 3. Create Draft Contract for employee 1 linked to test structure
    const contractRes = await query(`
      INSERT INTO contracts (contract_number, employee_id, salary_structure_id, wage_per_month, start_date, status)
      VALUES ('CON_MATH_TEST', 1, $1, 5000.00, '2026-04-01', 'Draft')
      RETURNING id
    `, [testStructureId]);
    testContractId = contractRes.rows[0].id;

    // 4. Create Payrun
    const payrunRes = await query(`
      INSERT INTO payruns (company_id, name, salary_structure_id, period_start, period_end, status)
      VALUES (1, 'Math Test Payrun', $1, '2026-04-01', '2026-04-30', 'Draft')
      RETURNING id
    `, [testStructureId]);
    testPayrunId = payrunRes.rows[0].id;

    // 5. Create Draft Payslip
    const payslipRes = await query(`
      INSERT INTO payslips (payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, status)
      VALUES ($1, 1, $2, $3, '2026-04-01', '2026-04-30', 'Draft')
      RETURNING id
    `, [testPayrunId, testContractId, testStructureId]);
    testPayslipId = payslipRes.rows[0].id;
  });

  afterAll(async () => {
    if (testPayslipId) {
      await query('DELETE FROM payslip_lines WHERE payslip_id = $1', [testPayslipId]);
      await query('DELETE FROM payslips WHERE id = $1', [testPayslipId]);
    }
    if (testPayrunId) {
      await query('DELETE FROM payruns WHERE id = $1', [testPayrunId]);
    }
    if (testContractId) {
      await query('DELETE FROM contracts WHERE id = $1', [testContractId]);
    }
    if (testStructureId) {
      await query('DELETE FROM salary_rules WHERE salary_structure_id = $1', [testStructureId]);
      await query('DELETE FROM salary_structures WHERE id = $1', [testStructureId]);
    }
    await closeDb();
  });

  test('compute_payslip calculates exact expected net_amount and generates sequenced lines', async () => {
    // Trigger computation via PostgreSQL engine
    await query('SELECT compute_payslip($1)', [testPayslipId]);

    // Fetch computed payslip via API
    const res = await request(app)
      .get(`/api/payslips/${testPayslipId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const slip = res.body.data;
    expect(parseFloat(slip.basic_amount)).toBe(5000.00);
    expect(parseFloat(slip.gross_amount)).toBe(6000.00); // 5000 + 20% of 5000 (1000)
    expect(parseFloat(slip.net_amount)).toBe(5500.00);   // 6000 - 500
    expect(slip.status).toBe('Computed');

    // Verify payslip_lines sequence and computation amounts
    const lines = slip.lines;
    expect(lines.length).toBe(5);
    expect(lines[0].code).toBe('BASIC');
    expect(lines[0].sequence).toBe(10);
    expect(parseFloat(lines[0].computed_amount)).toBe(5000.00);

    expect(lines[1].code).toBe('HRA');
    expect(lines[1].sequence).toBe(20);
    expect(parseFloat(lines[1].computed_amount)).toBe(1000.00);

    expect(lines[2].code).toBe('GROSS');
    expect(lines[2].sequence).toBe(70);
    expect(parseFloat(lines[2].computed_amount)).toBe(6000.00);

    expect(lines[3].code).toBe('STD_DED');
    expect(lines[3].sequence).toBe(80);
    expect(parseFloat(lines[3].computed_amount)).toBe(500.00);

    expect(lines[4].code).toBe('NET');
    expect(lines[4].sequence).toBe(120);
    expect(parseFloat(lines[4].computed_amount)).toBe(5500.00);
  });
});
