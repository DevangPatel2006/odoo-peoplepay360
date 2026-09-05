import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Payrun Wizard & Processing Integration Tests', () => {
  let payrollToken;
  let payrunId;
  let testEmployeeIds = [];
  let extraEmployeeIds = [];
  let testContractIds = [];

  beforeAll(async () => {
    payrollToken = await getAuthToken('payrolluser@peoplepay360.com');

    // Ensure employee 1 has bank account number
    await query("UPDATE employees SET bank_account_number = 'US999888777' WHERE id = 1");

    // Create 2 test employees in addition to employee 1 (admin)
    const e2 = await query(`
      INSERT INTO employees (company_id, employee_code, first_name, last_name, work_email, department_id, job_position_id, employee_type, status, date_of_joining, bank_account_number)
      VALUES (1, 'EMP-PW-2', 'Payrun2', 'User2', 'payrun.u2@peoplepay360.com', 1, 1, 'Full-time', 'Active', '2026-01-01', 'US111222333')
      RETURNING id
    `);
    const e3 = await query(`
      INSERT INTO employees (company_id, employee_code, first_name, last_name, work_email, department_id, job_position_id, employee_type, status, date_of_joining, bank_account_number)
      VALUES (1, 'EMP-PW-3', 'Payrun3', 'User3', 'payrun.u3@peoplepay360.com', 1, 1, 'Full-time', 'Active', '2026-01-01', 'US444555666')
      RETURNING id
    `);

    extraEmployeeIds = [e2.rows[0].id, e3.rows[0].id];
    testEmployeeIds = [1, ...extraEmployeeIds];

    for (let i = 0; i < testEmployeeIds.length; i++) {
      const empId = testEmployeeIds[i];
      const cRes = await query(`
        INSERT INTO contracts (contract_number, employee_id, salary_structure_id, wage_per_month, start_date, status)
        VALUES ($1, $2, 1, 5000.00, '2026-01-01', 'Running')
        RETURNING id
      `, [`CON-PW-${i + 1}-${Date.now()}`, empId]);
      testContractIds.push(cRes.rows[0].id);
    }
  });

  afterAll(async () => {
    if (payrunId) {
      await query('DELETE FROM payroll_warnings WHERE payslip_id IN (SELECT id FROM payslips WHERE payrun_id = $1)', [payrunId]);
      await query('DELETE FROM payslips WHERE payrun_id = $1', [payrunId]);
      await query('DELETE FROM payrun_employees WHERE payrun_id = $1', [payrunId]);
      await query('DELETE FROM payruns WHERE id = $1', [payrunId]);
    }
    if (testContractIds.length > 0) {
      await query('DELETE FROM contracts WHERE id = ANY($1)', [testContractIds]);
    }
    if (extraEmployeeIds.length > 0) {
      await query('DELETE FROM employees WHERE id = ANY($1)', [extraEmployeeIds]);
    }
    await closeDb();
  });

  test('Step 1 preview is stateless and persists zero records', async () => {
    const beforeCountRes = await query('SELECT COUNT(*) FROM payruns');
    const beforeCount = parseInt(beforeCountRes.rows[0].count, 10);

    const res = await request(app)
      .post('/api/payruns/preview-eligible-employees')
      .set('Authorization', `Bearer ${payrollToken}`)
      .send({
        salary_structure_id: 1,
        period_start: '2026-03-01',
        period_end: '2026-03-31',
        employee_type_filter: 'Full-time',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const afterCountRes = await query('SELECT COUNT(*) FROM payruns');
    const afterCount = parseInt(afterCountRes.rows[0].count, 10);
    expect(afterCount).toBe(beforeCount); // Zero records persisted
  });

  test('Step 2 creates payrun and payrun_employees with resolved contracts', async () => {
    const res = await request(app)
      .post('/api/payruns')
      .set('Authorization', `Bearer ${payrollToken}`)
      .send({
        name: 'March 2026 Regular Payrun',
        salary_structure_id: 1,
        period_start: '2026-03-01',
        period_end: '2026-03-31',
        employee_type_filter: 'Full-time',
        employee_ids: testEmployeeIds,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payrun.id).toBeDefined();
    expect(res.body.data.payrun.status).toBe('Draft');
    expect(res.body.data.employees.length).toBe(testEmployeeIds.length);

    payrunId = res.body.data.payrun.id;

    // Verify resolved contract IDs are saved in payrun_employees
    const peRes = await query('SELECT * FROM payrun_employees WHERE payrun_id = $1', [payrunId]);
    expect(peRes.rows.length).toBe(testEmployeeIds.length);
    for (const row of peRes.rows) {
      expect(row.resolved_contract_id).toBeDefined();
    }
  });

  test('Re-selecting duplicate employee is handled or rejected by uk_payrun_employee', async () => {
    // Attempting to manually insert duplicate employee into the same payrun
    await expect(
      query('INSERT INTO payrun_employees (payrun_id, employee_id, resolved_contract_id) VALUES ($1, $2, $3)', [payrunId, testEmployeeIds[0], testContractIds[0]])
    ).rejects.toThrow();
  });

  test('Payrun compute action computes payslips and warnings', async () => {
    const res = await request(app)
      .post(`/api/payruns/${payrunId}/compute`)
      .set('Authorization', `Bearer ${payrollToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Computed');
    expect(res.body.data.payslips.length).toBe(testEmployeeIds.length);
  });
});
