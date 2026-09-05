import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Time Off Allocation & Requests Integration Tests', () => {
  let hrToken;
  let employeeToken;
  let testTypeRequiresAllocId;
  let testAllocationId;
  let adminAllocationId;
  let testRequestId;
  let testEmpId;

  beforeAll(async () => {
    hrToken = await getAuthToken('hrmanager@peoplepay360.com');
    employeeToken = await getAuthToken('david.engineer@peoplepay360.com');

    // 1. Create a Time Off Type requiring allocation
    const typeRes = await query(`
      INSERT INTO time_off_types (name, unit, requires_allocation, approval_level, affects_payroll, display_color, is_active)
      VALUES ('Test Vacation Leave', 'Days', true, 'Manager', true, '#00AAFF', true)
      RETURNING id
    `);
    testTypeRequiresAllocId = typeRes.rows[0].id;

    // 2. Resolve test employee id for david.engineer
    const empRes = await query('SELECT employee_id FROM users WHERE work_email = $1', ['david.engineer@peoplepay360.com']);
    testEmpId = empRes.rows[0]?.employee_id;

    // 3. Create an Approved allocation of 15 days for the test employee
    const allocRes = await query(`
      INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_amount, taken_amount, status, validity_start, validity_end)
      VALUES ($1, $2, 15.00, 0.00, 'Approved', '2026-01-01', '2026-12-31')
      RETURNING id
    `, [testEmpId, testTypeRequiresAllocId]);
    testAllocationId = allocRes.rows[0].id;

    // 4. Create an allocation belonging to Admin (employee 1) to test non-self access
    const adminAllocRes = await query(`
      INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_amount, taken_amount, status, validity_start, validity_end)
      VALUES (1, $1, 20.00, 0.00, 'Approved', '2026-01-01', '2026-12-31')
      RETURNING id
    `, [testTypeRequiresAllocId]);
    adminAllocationId = adminAllocRes.rows[0].id;
  });

  afterAll(async () => {
    if (testRequestId) {
      await query('DELETE FROM time_off_requests WHERE id = $1', [testRequestId]);
    }
    if (testAllocationId) {
      await query('DELETE FROM time_off_allocations WHERE id = $1', [testAllocationId]);
    }
    if (adminAllocationId) {
      await query('DELETE FROM time_off_allocations WHERE id = $1', [adminAllocationId]);
    }
    if (testTypeRequiresAllocId) {
      await query('DELETE FROM time_off_types WHERE id = $1', [testTypeRequiresAllocId]);
    }
    await closeDb();
  });

  test('Employee cannot approve a time off request (RBAC can_approve enforcement)', async () => {
    // 1. Employee creates a request
    const createRes = await request(app)
      .post('/api/time-off/requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        time_off_type_id: testTypeRequiresAllocId,
        start_date: '2026-05-10',
        end_date: '2026-05-12',
        duration: 3.00,
        allocation_id: testAllocationId,
        reason: 'Family trip',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    testRequestId = createRes.body.data.id;

    // 2. Employee attempts to self-approve
    const approveRes = await request(app)
      .patch(`/api/time-off/requests/${testRequestId}/approve`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(approveRes.status).toBe(403);
    expect(approveRes.body.success).toBe(false);
    expect(approveRes.body.error.code).toBe('FORBIDDEN');
  });

  test('Approving a request without required allocation raises 422', async () => {
    // Create a request with no allocation_id
    const unallocatedReqRes = await query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, allocation_id)
      VALUES ($1, $2, '2026-06-01', '2026-06-02', 2.00, 'To Approve', NULL)
      RETURNING id
    `, [testEmpId, testTypeRequiresAllocId]);
    const unallocatedId = unallocatedReqRes.rows[0].id;

    const res = await request(app)
      .patch(`/api/time-off/requests/${unallocatedId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);

    await query('DELETE FROM time_off_requests WHERE id = $1', [unallocatedId]);
  });

  test('Valid approval decrements taken_amount and remaining_amount via trigger', async () => {
    // HR approves the valid request with 3 days duration
    const res = await request(app)
      .patch(`/api/time-off/requests/${testRequestId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ reason: 'Approved by HR' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Approved');

    // Verify allocation taken_amount incremented and remaining_amount decremented
    const allocRes = await query('SELECT * FROM time_off_allocations WHERE id = $1', [testAllocationId]);
    const alloc = allocRes.rows[0];
    expect(parseFloat(alloc.taken_amount)).toBe(3.00);
    expect(parseFloat(alloc.remaining_amount)).toBe(12.00); // 15 - 3 = 12
  });

  test('Cannot delete an approved request directly (deletion guard)', async () => {
    const res = await request(app)
      .delete(`/api/time-off/requests/${testRequestId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('APPROVED_REQUEST_NOT_DELETABLE');
  });

  test('Cannot hard delete a time off type referenced by allocations', async () => {
    const res = await request(app)
      .delete(`/api/time-off/types/${testTypeRequiresAllocId}`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TYPE_IN_USE');
  });

  test('Request exceeding remaining allocation balance raises 422', async () => {
    // Current remaining is 12.00. Create a request for 20.00 days
    const overReqRes = await query(`
      INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, duration, status, allocation_id)
      VALUES ($1, $2, '2026-07-01', '2026-07-20', 20.00, 'To Approve', $3)
      RETURNING id
    `, [testEmpId, testTypeRequiresAllocId, testAllocationId]);
    const overReqId = overReqRes.rows[0].id;

    const res = await request(app)
      .patch(`/api/time-off/requests/${overReqId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_ALLOCATION');

    await query('DELETE FROM time_off_requests WHERE id = $1', [overReqId]);
  });

  test('Employee cannot read another employee allocations (self-scoping)', async () => {
    // David Engineer tries to read Admin allocation (belongs to employee 1)
    const res = await request(app)
      .get(`/api/time-off/allocations/${adminAllocationId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
