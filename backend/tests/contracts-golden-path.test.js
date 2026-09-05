import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Contracts Golden Path Integration Tests', () => {
  let hrManagerToken;
  let adminToken;

  const testEmail = `golden.contract.${Date.now()}@peoplepay360.com`;
  const testEmpCode = `EMP-GP-${Math.floor(1000 + Math.random() * 9000)}`;
  let employeeId;
  let firstContractId;
  let firstContractNumber;
  let secondContractId;
  let draftContractId;

  beforeAll(async () => {
    hrManagerToken = await getAuthToken('hrmanager@peoplepay360.com');
    adminToken = await getAuthToken('admin@peoplepay360.com');
  });

  afterAll(async () => {
    // Cleanup created test records
    if (employeeId) {
      await query('DELETE FROM contracts WHERE employee_id = $1', [employeeId]);
      await query('DELETE FROM users WHERE LOWER(work_email) = LOWER($1)', [testEmail]);
      await query('DELETE FROM employees WHERE id = $1', [employeeId]);
    }
    await closeDb();
  });

  test('Step 1: Create employee with account provisioning', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee_code: testEmpCode,
        first_name: 'Golden',
        last_name: 'Path',
        work_email: testEmail,
        employee_type: 'Full-time',
        date_of_joining: '2026-01-01',
        department_id: 1,
        status: 'Active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('temporary_password');
    expect(res.body.data.account.work_email).toBe(testEmail);

    employeeId = res.body.data.id;

    // Verify user row exists
    const userDb = await query('SELECT * FROM users WHERE employee_id = $1', [employeeId]);
    expect(userDb.rows.length).toBe(1);
  });

  test('Step 2: Create Draft contract leaving contract_number blank (server generates number)', async () => {
    const res = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee_id: employeeId,
        department_id: 1,
        job_position_id: 1,
        working_schedule_id: 1,
        salary_structure_id: 1,
        wage_per_month: 8500.00,
        start_date: '2026-01-01',
        status: 'Draft',
        // contract_number omitted to trigger auto-generation
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const contract = res.body.data;

    expect(contract).toHaveProperty('id');
    expect(contract.status).toBe('Draft');
    expect(contract.contract_number).toBeTruthy();
    expect(contract.contract_number).toMatch(/^CON\/\d{4}\/\d{4}$/);

    firstContractId = contract.id;
    firstContractNumber = contract.contract_number;

    // Verify GET /contracts?employee_id=<id> returns this contract
    const listRes = await request(app)
      .get(`/api/contracts?employee_id=${employeeId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((c) => c.id === firstContractId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('Draft');
  });

  test('Step 3: Activate contract (sets Running, back-syncs to employee, increments smart button count)', async () => {
    const activateRes = await request(app)
      .post(`/api/contracts/${firstContractId}/activate`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.success).toBe(true);
    expect(activateRes.body.data.status).toBe('Running');

    // Confirm GET /employees/:id shows matching department_id and working_schedule_id (back-sync fix)
    const empRes = await request(app)
      .get(`/api/employees/${employeeId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(empRes.status).toBe(200);
    expect(empRes.body.data.department_id).toBe(1);
    expect(empRes.body.data.working_schedule_id).toBe(1);

    // Confirm GET /employees/:id/contracts reflects the active contract
    const contractsRes = await request(app)
      .get(`/api/employees/${employeeId}/contracts`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(contractsRes.status).toBe(200);
    expect(contractsRes.body.data.length).toBeGreaterThanOrEqual(1);
    const activeContract = contractsRes.body.data.find((c) => c.id === firstContractId);
    expect(activeContract.status).toBe('Running');
  });

  test('Step 4: Dashboard department overview reflects updated committed salary immediately', async () => {
    const dashRes = await request(app)
      .get('/api/dashboard/department-overview')
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    const deptOverview = dashRes.body.data.find((d) => d.department_id === 1);
    expect(deptOverview).toBeTruthy();
    expect(parseFloat(deptOverview.total_monthly_committed_salary)).toBeGreaterThanOrEqual(8500.00);
  });

  test('Step 5: Payrun preview includes employee with resolved_contract_id', async () => {
    const previewRes = await request(app)
      .post('/api/payruns/preview-eligible-employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        salary_structure_id: 1,
        period_start: '2026-06-01',
        period_end: '2026-06-30',
      });

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.success).toBe(true);

    const eligible = Array.isArray(previewRes.body.data) ? previewRes.body.data : (previewRes.body.data.eligible || []);
    const match = eligible.find((e) => e.employee.id === employeeId);
    expect(match).toBeTruthy();
    expect(match.resolved_contract.id).toBe(firstContractId);
    expect(match.resolved_contract.status).toBe('Running');
  });

  test('Step 6: Enforces single Running contract; activating second contract supersedes the first', async () => {
    // Direct attempt to create a second Running contract 409s
    const duplicateRunningRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee_id: employeeId,
        salary_structure_id: 1,
        wage_per_month: 9500.00,
        start_date: '2026-07-01',
        status: 'Running',
      });

    expect(duplicateRunningRes.status).toBe(409);
    expect(duplicateRunningRes.body.error.code).toBe('CONFLICT');

    // Create second contract as Draft
    const draftRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee_id: employeeId,
        salary_structure_id: 1,
        wage_per_month: 9500.00,
        start_date: '2026-07-01',
        status: 'Draft',
      });

    expect(draftRes.status).toBe(201);
    secondContractId = draftRes.body.data.id;

    // Activate the second contract -> supersedes first contract to Expired
    const activateSecondRes = await request(app)
      .post(`/api/contracts/${secondContractId}/activate`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(activateSecondRes.status).toBe(200);
    expect(activateSecondRes.body.data.status).toBe('Running');

    // Verify first contract is now Expired
    const firstCheckRes = await request(app)
      .get(`/api/contracts/${firstContractId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);
    expect(firstCheckRes.body.data.status).toBe('Expired');

    // Verify exactly one Running contract exists for employee
    const runningListRes = await request(app)
      .get(`/api/contracts?employee_id=${employeeId}&status=Running`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(runningListRes.status).toBe(200);
    expect(runningListRes.body.data.length).toBe(1);
    expect(runningListRes.body.data[0].id).toBe(secondContractId);
  });

  test('Step 7: Enforces Draft-only deletion guard', async () => {
    // Deleting Running contract fails with 400
    const deleteRunningRes = await request(app)
      .delete(`/api/contracts/${secondContractId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(deleteRunningRes.status).toBe(400);
    expect(deleteRunningRes.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(deleteRunningRes.body.error.message).toContain('Only Draft contracts can be deleted');

    // Deleting Expired contract fails with 400
    const deleteExpiredRes = await request(app)
      .delete(`/api/contracts/${firstContractId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(deleteExpiredRes.status).toBe(400);
    expect(deleteExpiredRes.body.error.message).toContain('Only Draft contracts can be deleted');

    // Creating a Draft contract and deleting it succeeds
    const newDraftRes = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee_id: employeeId,
        salary_structure_id: 1,
        wage_per_month: 6000.00,
        start_date: '2026-08-01',
        status: 'Draft',
      });

    draftContractId = newDraftRes.body.data.id;

    const deleteDraftRes = await request(app)
      .delete(`/api/contracts/${draftContractId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(deleteDraftRes.status).toBe(200);
    expect(deleteDraftRes.body.success).toBe(true);

    // Verify it is gone from the database
    const verifyDeleteRes = await request(app)
      .get(`/api/contracts/${draftContractId}`)
      .set('Authorization', `Bearer ${hrManagerToken}`);
    expect(verifyDeleteRes.status).toBe(404);
  });
});
