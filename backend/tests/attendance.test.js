import { app, request, getAuthToken, query, closeDb } from './testHelper.js';

describe('Attendance Module Integration Tests', () => {
  let adminToken;
  let hrManagerToken;
  let employeeToken;

  const testEmail = `att.test.${Date.now()}@peoplepay360.com`;
  const testEmpCode = `EMP-ATT-${Math.floor(1000 + Math.random() * 9000)}`;
  let employeeId;
  let attendanceId;

  beforeAll(async () => {
    adminToken = await getAuthToken('admin@peoplepay360.com');
    hrManagerToken = await getAuthToken('hrmanager@peoplepay360.com');

    // Create a test employee for attendance tests
    const empRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employee_code: testEmpCode,
        first_name: 'Attendance',
        last_name: 'Tester',
        work_email: testEmail,
        employee_type: 'Full-time',
        date_of_joining: '2026-01-01',
        department_id: 1,
        status: 'Active',
      });

    employeeId = empRes.body.data?.id;

    // Login as the created employee to get employee-scoped token
    try {
      const tempPassword = empRes.body.data?.temporary_password;
      if (tempPassword) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ work_email: testEmail, password: tempPassword });
        employeeToken = loginRes.body.data?.token;
      }
    } catch (err) {
      // Employee login may not work if password setup differs; tests will skip employee-scoped tests
      console.warn('Employee login not available for scoped tests:', err.message);
    }
  });

  afterAll(async () => {
    // Cleanup test records
    if (employeeId) {
      await query('DELETE FROM attendances WHERE employee_id = $1', [employeeId]);
      await query('DELETE FROM users WHERE LOWER(work_email) = LOWER($1)', [testEmail]);
      await query('DELETE FROM employees WHERE id = $1', [employeeId]);
    }
    await closeDb();
  });

  // =========================================================================
  // 1. Check-in success
  // =========================================================================
  test('Check-in creates attendance with 201 and returns check_in_at', async () => {
    // Clean slate: ensure no attendance exists for today
    const today = new Date().toISOString().split('T')[0];
    await query('DELETE FROM attendances WHERE employee_id = $1 AND attendance_date = $2', [employeeId, today]);

    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('check_in_at');
    expect(res.body.data).toHaveProperty('attendance_date');
    expect(res.body.data.employee_id).toBe(employeeId);
    expect(res.body.data.status).toBe('Present');
    // Should include joined employee fields from re-fetch
    expect(res.body.data).toHaveProperty('employee_first_name');

    attendanceId = res.body.data.id;
  });

  // =========================================================================
  // 2. Duplicate check-in conflict (409)
  // =========================================================================
  test('Duplicate same-day check-in returns 409 CONFLICT', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  // =========================================================================
  // 3. Check-out without prior check-in (404)
  // =========================================================================
  test('Check-out without prior check-in returns 404', async () => {
    // Create a new temp employee with no attendance record
    const noCheckInEmail = `att.noci.${Date.now()}@peoplepay360.com`;
    const noCheckInCode = `EMP-NCI-${Math.floor(1000 + Math.random() * 9000)}`;
    const empRes = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employee_code: noCheckInCode,
        first_name: 'NoCheckIn',
        last_name: 'Tester',
        work_email: noCheckInEmail,
        employee_type: 'Full-time',
        date_of_joining: '2026-01-01',
        department_id: 1,
        status: 'Active',
      });

    const tempEmpId = empRes.body.data?.id;

    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: tempEmpId });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);

    // Cleanup temp employee
    if (tempEmpId) {
      await query('DELETE FROM users WHERE LOWER(work_email) = LOWER($1)', [noCheckInEmail]);
      await query('DELETE FROM employees WHERE id = $1', [tempEmpId]);
    }
  });

  // =========================================================================
  // 4. Successful check-out with correct worked_hours (from generated column)
  // =========================================================================
  test('Check-out succeeds and returns worked_hours from DB generated column', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('check_out_at');
    // worked_hours should be populated by the DB STORED GENERATED column
    expect(res.body.data).toHaveProperty('worked_hours');
    expect(parseFloat(res.body.data.worked_hours)).toBeGreaterThanOrEqual(0);
  });

  // =========================================================================
  // 5. Double check-out returns 400
  // =========================================================================
  test('Double check-out returns 400 ALREADY_CHECKED_OUT', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employee_id: employeeId });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ALREADY_CHECKED_OUT');
  });

  // =========================================================================
  // 6. HR Manager has full company-wide read access
  // =========================================================================
  test('HR Manager can list all attendance records company-wide', async () => {
    const res = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${hrManagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('total');
  });

  // =========================================================================
  // 7. Manual correction stamps is_manual_correction and corrected_by_user_id
  // =========================================================================
  test('PATCH stamps is_manual_correction and corrected_by_user_id server-side', async () => {
    // Note: attendanceId was created in test 1
    const res = await request(app)
      .patch(`/api/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Corrected by admin',
        status: 'Late',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_manual_correction).toBe(true);
    expect(res.body.data.corrected_by_user_id).toBeTruthy();
    expect(res.body.data.status).toBe('Late');
  });

  // =========================================================================
  // 8. Future date rejected by validator
  // =========================================================================
  test('Check-in with future date is rejected by validator', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employee_id: employeeId,
        attendance_date: futureDateStr,
      });

    // Should be rejected by Joi .max('now') validation
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // =========================================================================
  // 9. Employee-scoped access (own records only)
  // =========================================================================
  test('Employee role can only access own attendance (if token available)', async () => {
    if (!employeeToken) {
      console.warn('Skipping employee scope test — no employee token available');
      return;
    }

    const res = await request(app)
      .get('/api/attendance')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // All returned records should belong to this employee only
    const records = res.body.data || [];
    for (const record of records) {
      expect(record.employee_id).toBe(employeeId);
    }
  });

  // =========================================================================
  // 10. GET by ID returns full joined shape
  // =========================================================================
  test('GET /attendance/:id returns full joined record', async () => {
    const res = await request(app)
      .get(`/api/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('employee_first_name');
    expect(res.body.data).toHaveProperty('employee_last_name');
    expect(res.body.data).toHaveProperty('employee_code');
    expect(res.body.data).toHaveProperty('department_name');
    expect(res.body.data).toHaveProperty('check_in_at');
    expect(res.body.data).toHaveProperty('check_out_at');
    expect(res.body.data).toHaveProperty('worked_hours');
  });

  // =========================================================================
  // 11. worked_hours cannot be set via PATCH
  // =========================================================================
  test('PATCH cannot set worked_hours (stripped by validator + model)', async () => {
    const res = await request(app)
      .patch(`/api/attendance/${attendanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        worked_hours: 999,
        notes: 'Attempted to override worked_hours',
      });

    expect(res.status).toBe(200);
    // worked_hours should NOT be 999 — it's a STORED generated column
    expect(parseFloat(res.body.data.worked_hours)).not.toBe(999);
  });
});
