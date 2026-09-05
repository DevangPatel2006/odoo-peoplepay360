import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Employee Creation & Credentials Provisioning Integration Tests', () => {
  let adminToken;
  let hrManagerToken;
  let employeeToken;

  const testEmail = `test.employee.${Date.now()}@peoplepay360.com`;
  const testCode = `EMP-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  let createdEmployeeId;
  let initialTempPassword;

  beforeAll(async () => {
    adminToken = await getAuthToken('admin@peoplepay360.com');
    hrManagerToken = await getAuthToken('hrmanager@peoplepay360.com');
    employeeToken = await getAuthToken('david.engineer@peoplepay360.com');
  });

  afterAll(async () => {
    // Cleanup created test records
    if (createdEmployeeId) {
      await query('DELETE FROM employees WHERE id = $1', [createdEmployeeId]);
      await query('DELETE FROM users WHERE LOWER(work_email) = LOWER($1)', [testEmail]);
    }
    await closeDb();
  });

  test('HR Manager can create employee, automatically provisioning user account and temporary password', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${hrManagerToken}`)
      .send({
        employee_code: testCode,
        first_name: 'Test',
        last_name: 'Provisioning',
        work_email: testEmail,
        employee_type: 'Full-time',
        date_of_joining: '2026-03-01',
        status: 'Active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    expect(data).toHaveProperty('id');
    expect(data.work_email).toBe(testEmail);
    expect(data).toHaveProperty('temporary_password');
    expect(typeof data.temporary_password).toBe('string');
    expect(data.temporary_password.length).toBeGreaterThan(8);
    expect(data).toHaveProperty('account');
    expect(data.account.work_email).toBe(testEmail);
    expect(data).toHaveProperty('welcome_email');

    createdEmployeeId = data.id;
    initialTempPassword = data.temporary_password;

    // Verify user row exists in DB
    const userDbRes = await query('SELECT * FROM users WHERE employee_id = $1', [createdEmployeeId]);
    expect(userDbRes.rows.length).toBe(1);
    expect(userDbRes.rows[0].work_email).toBe(testEmail);

    // Verify user has Employee role assigned
    const userRolesRes = await query(
      `SELECT r.name FROM roles r 
       JOIN user_roles ur ON ur.role_id = r.id 
       WHERE ur.user_id = $1`,
      [userDbRes.rows[0].id]
    );
    const roleNames = userRolesRes.rows.map((r) => r.name);
    expect(roleNames).toContain('Employee');
  });

  test('New employee can log in with generated temporary credentials', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        work_email: testEmail,
        password: initialTempPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toHaveProperty('token');
    expect(loginRes.body.data.user.work_email).toBe(testEmail);
    expect(loginRes.body.data.user.employee_id).toBe(createdEmployeeId);
  });

  test('Enforces uniqueness on work_email during creation (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employee_code: `${testCode}-DUP`,
        first_name: 'Duplicate',
        last_name: 'User',
        work_email: testEmail, // same email
        employee_type: 'Full-time',
        date_of_joining: '2026-03-01',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  test('HR Manager can reset credentials, issuing a new temporary password', async () => {
    const res = await request(app)
      .post(`/api/employees/${createdEmployeeId}/reset-credentials`)
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    expect(data).toHaveProperty('temporary_password');
    const newTempPassword = data.temporary_password;
    expect(newTempPassword).not.toBe(initialTempPassword);

    // Verify old password fails
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        work_email: testEmail,
        password: initialTempPassword,
      });
    expect(oldLoginRes.status).toBe(401);

    // Verify new password succeeds
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        work_email: testEmail,
        password: newTempPassword,
      });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.success).toBe(true);
  });

  test('Regular Employee cannot create employees or reset credentials (403 Forbidden)', async () => {
    const createRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employee_code: 'UNAUTHORIZED-EMP',
        first_name: 'Unauthorized',
        last_name: 'Employee',
        work_email: 'unauth@peoplepay360.com',
        employee_type: 'Full-time',
        date_of_joining: '2026-03-01',
      });
    expect(createRes.status).toBe(403);

    const resetRes = await request(app)
      .post(`/api/employees/${createdEmployeeId}/reset-credentials`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(resetRes.status).toBe(403);
  });
});
