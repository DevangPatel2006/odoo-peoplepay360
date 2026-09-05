import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Contracts Integration Tests', () => {
  let adminToken;
  let employeeToken;

  beforeAll(async () => {
    adminToken = await getAuthToken('admin@peoplepay360.com');
    employeeToken = await getAuthToken('david.engineer@peoplepay360.com');
  });

  afterAll(async () => {
    await closeDb();
  });

  test('enforces single Running contract per employee (409 Conflict)', async () => {
    // Employee 1 already has seeded contract CON/2026/0001 with status 'Running'
    const res = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        contract_number: 'CON_DUPLICATE_RUNNING_TEST',
        employee_id: 1,
        salary_structure_id: 1,
        wage_per_month: 9000.00,
        start_date: '2026-01-01',
        status: 'Running',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('Employee already has a running contract');
  });

  test('get_applicable_contract returns 422 when no applicable contract exists for period', async () => {
    // Period in the past before contract start date (or in 2020)
    const res = await request(app)
      .get('/api/contracts/applicable?employee_id=1&period_start=2020-01-01&period_end=2020-01-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  test('Employee role cannot read another employee contract (self-scoping)', async () => {
    // David Engineer (employee ID 4) tries to read contract 1 (belongs to Employee 1)
    const res = await request(app)
      .get('/api/contracts/1')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('Employee role can read their own contract', async () => {
    // David Engineer (employee ID 4) has contract 4
    const res = await request(app)
      .get('/api/contracts/4')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee_id).toBe(4);
    expect(res.body.data.is_active).toBe(true);
  });
});
