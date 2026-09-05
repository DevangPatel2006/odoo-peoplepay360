import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Contracts Integration Tests', () => {
  let adminToken;
  let employeeToken;
  let davidEmpId;
  let contract1Id;
  let contract4Id;

  beforeAll(async () => {
    adminToken = await getAuthToken('admin@peoplepay360.com');
    employeeToken = await getAuthToken('david.engineer@peoplepay360.com');

    const empRes = await query('SELECT employee_id FROM users WHERE work_email = $1', ['david.engineer@peoplepay360.com']);
    davidEmpId = empRes.rows[0]?.employee_id;

    // Ensure test running contracts exist for isolation
    const c1Res = await query(`
      SELECT id FROM contracts WHERE employee_id = 1 AND status = 'Running' LIMIT 1
    `);
    if (c1Res.rows.length > 0) {
      contract1Id = c1Res.rows[0].id;
    } else {
      const ins = await query(`
        INSERT INTO contracts (contract_number, employee_id, salary_structure_id, wage_per_month, start_date, status)
        VALUES ('CON/TEST/0001', 1, 1, 8000.00, '2026-01-01', 'Running')
        RETURNING id
      `);
      contract1Id = ins.rows[0].id;
    }

    if (davidEmpId) {
      const c4Res = await query(`
        SELECT id FROM contracts WHERE employee_id = $1 AND status = 'Running' LIMIT 1
      `, [davidEmpId]);
      if (c4Res.rows.length > 0) {
        contract4Id = c4Res.rows[0].id;
      } else {
        const ins = await query(`
          INSERT INTO contracts (contract_number, employee_id, salary_structure_id, wage_per_month, start_date, status)
          VALUES ('CON/TEST/0004', $1, 1, 6000.00, '2026-01-01', 'Running')
          RETURNING id
        `, [davidEmpId]);
        contract4Id = ins.rows[0].id;
      }
    }
  });

  afterAll(async () => {
    await query(`DELETE FROM contracts WHERE contract_number IN ('CON/TEST/0001', 'CON/TEST/0004')`);
    await closeDb();
  });

  test('enforces single Running contract per employee (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employee_id: 1,
        contract_number: 'CON/2026/9999',
        salary_structure_id: 1,
        wage_per_month: 9000.00,
        start_date: '2026-02-01',
        status: 'Running',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('get_applicable_contract returns 422 when no applicable contract exists for period', async () => {
    const res = await request(app)
      .get('/api/contracts/applicable?employee_id=1&period_start=2020-01-01&period_end=2020-01-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  test('Employee role cannot read another employee contract (self-scoping)', async () => {
    // David Engineer tries to read contract 1 (belongs to Employee 1)
    const res = await request(app)
      .get(`/api/contracts/${contract1Id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('Employee role can read their own contract', async () => {
    const res = await request(app)
      .get(`/api/contracts/${contract4Id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee_id).toBe(davidEmpId);
    expect(res.body.data.is_active).toBe(true);
  });
});
