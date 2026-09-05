import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Payrun Wizard & Processing Integration Tests', () => {
  let payrollToken;
  let payrunId;

  beforeAll(async () => {
    payrollToken = await getAuthToken('payrolluser@peoplepay360.com');
  });

  afterAll(async () => {
    if (payrunId) {
      await query('DELETE FROM payroll_warnings WHERE payslip_id IN (SELECT id FROM payslips WHERE payrun_id = $1)', [payrunId]);
      await query('DELETE FROM payslips WHERE payrun_id = $1', [payrunId]);
      await query('DELETE FROM payrun_employees WHERE payrun_id = $1', [payrunId]);
      await query('DELETE FROM payruns WHERE id = $1', [payrunId]);
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
        employee_ids: [1, 2, 4],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payrun.id).toBeDefined();
    expect(res.body.data.payrun.status).toBe('Draft');
    expect(res.body.data.employees.length).toBe(3);

    payrunId = res.body.data.payrun.id;

    // Verify resolved contract IDs are saved in payrun_employees
    const peRes = await query('SELECT * FROM payrun_employees WHERE payrun_id = $1', [payrunId]);
    expect(peRes.rows.length).toBe(3);
    for (const row of peRes.rows) {
      expect(row.resolved_contract_id).toBeDefined();
    }
  });

  test('Re-selecting duplicate employee is handled or rejected by uk_payrun_employee', async () => {
    // Attempting to manually insert duplicate employee into the same payrun
    await expect(
      query('INSERT INTO payrun_employees (payrun_id, employee_id, resolved_contract_id) VALUES ($1, 1, 1)', [payrunId])
    ).rejects.toThrow();
  });

  test('Payrun compute action computes payslips and warnings', async () => {
    const res = await request(app)
      .post(`/api/payruns/${payrunId}/compute`)
      .set('Authorization', `Bearer ${payrollToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Computed');
    expect(res.body.data.payslips.length).toBe(3);
  });
});
