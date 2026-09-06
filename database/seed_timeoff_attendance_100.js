import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'peoplepay360',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'devang2006',
});

async function seedData() {
  const client = await pool.connect();

  try {
    console.log('=== STARTING SEEDING 100+ REALISTIC TIMEOFF & ATTENDANCE DATA ===');
    await client.query('BEGIN');

    // 1. Fetch Company & Employees
    const empRes = await client.query(`
      SELECT id, first_name, last_name, employee_code, department_id, employee_type, gender 
      FROM employees 
      ORDER BY id ASC
    `);
    const employees = empRes.rows;
    console.log(`Found ${employees.length} employees in database.`);

    if (employees.length === 0) {
      throw new Error('No employees found in database!');
    }

    // 2. Ensure Comprehensive Time Off Types Exist
    console.log('--- Ensuring Comprehensive Time Off Types Exist ---');
    const timeOffTypeDefinitions = [
      { name: 'Paid Time Off', unit: 'Days', requires_allocation: true, approval_level: 'Manager', affects_payroll: true, display_color: '#10B981' },
      { name: 'Sick Leave', unit: 'Days', requires_allocation: false, approval_level: 'Manager', affects_payroll: true, display_color: '#EF4444' },
      { name: 'Comp Off', unit: 'Hours', requires_allocation: true, approval_level: 'Officer', affects_payroll: true, display_color: '#F59E0B' },
      { name: 'Casual Leave', unit: 'Days', requires_allocation: true, approval_level: 'Manager', affects_payroll: true, display_color: '#8B5CF6' },
      { name: 'Parental Leave', unit: 'Days', requires_allocation: true, approval_level: 'Manager', affects_payroll: false, display_color: '#EC4899' },
      { name: 'Unpaid Leave', unit: 'Days', requires_allocation: false, approval_level: 'Manager', affects_payroll: true, display_color: '#64748B' },
      { name: 'Bereavement Leave', unit: 'Days', requires_allocation: false, approval_level: 'Manager', affects_payroll: false, display_color: '#0EA5E9' },
    ];

    const typeMap = {};
    for (const t of timeOffTypeDefinitions) {
      const res = await client.query(`
        INSERT INTO time_off_types (name, unit, requires_allocation, approval_level, affects_payroll, display_color, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (name) DO UPDATE 
        SET unit = EXCLUDED.unit,
            requires_allocation = EXCLUDED.requires_allocation,
            approval_level = EXCLUDED.approval_level,
            affects_payroll = EXCLUDED.affects_payroll,
            display_color = EXCLUDED.display_color
        RETURNING *
      `, [t.name, t.unit, t.requires_allocation, t.approval_level, t.affects_payroll, t.display_color]);
      typeMap[t.name] = res.rows[0];
    }
    console.log('Time Off Types configured:', Object.keys(typeMap));

    // 3. Ensure Time Off Allocations Exist for All Employees
    console.log('--- Ensuring Allocations for All Employees ---');
    for (const emp of employees) {
      // Casual Leave Allocation
      await client.query(`
        INSERT INTO time_off_allocations (
          employee_id, time_off_type_id, allocated_amount, taken_amount,
          status, validity_start, validity_end, description
        ) VALUES ($1, $2, 12.00, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Annual Casual Leave Entitlement')
        ON CONFLICT DO NOTHING
      `, [emp.id, typeMap['Casual Leave'].id]);

      // Comp Off Allocation (24 hours)
      await client.query(`
        INSERT INTO time_off_allocations (
          employee_id, time_off_type_id, allocated_amount, taken_amount,
          status, validity_start, validity_end, description
        ) VALUES ($1, $2, 24.00, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Project Overtime Compensatory Off')
        ON CONFLICT DO NOTHING
      `, [emp.id, typeMap['Comp Off'].id]);

      // Parental Leave Allocation (30 days)
      await client.query(`
        INSERT INTO time_off_allocations (
          employee_id, time_off_type_id, allocated_amount, taken_amount,
          status, validity_start, validity_end, description
        ) VALUES ($1, $2, 30.00, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Parental & Family Welfare Entitlement')
        ON CONFLICT DO NOTHING
      `, [emp.id, typeMap['Parental Leave'].id]);
    }

    // Helper to get allocation id for employee and type
    const getAllocationId = async (empId, typeId) => {
      const res = await client.query(`
        SELECT id, (allocated_amount - taken_amount) AS remaining
        FROM time_off_allocations
        WHERE employee_id = $1 AND time_off_type_id = $2 AND status = 'Approved'
        ORDER BY id DESC LIMIT 1
      `, [empId, typeId]);
      return res.rows[0]?.id || null;
    };

    // 4. Generate Exactly 100 New Realistic Time Off Requests
    console.log('--- Generating 100 New Realistic Time Off Requests ---');

    const REASON_TEMPLATES = {
      'Paid Time Off': [
        'Annual family holiday trip and vacation',
        'Attending sibling wedding ceremony in hometown',
        'Personal home relocation and settlement',
        'Extended weekend road trip recharge',
        'Personal mental wellness break and rest',
        'Child school annual function and family gathering',
        'Travel to hometown for ancestral cultural festival',
        'Housewarming ceremony preparations',
        'Visiting elderly parents out of state',
        'Vacation leave following project sprint delivery'
      ],
      'Sick Leave': [
        'Acute viral fever and physician recommended bed rest',
        'Severe dental extraction surgery and post-op recovery',
        'Food poisoning and gastroenteritis recovery',
        'Orthopedic knee consultation and physical therapy',
        'Seasonal allergic bronchitis medication rest',
        'Sudden acute migraine and medical rest',
        'Post-vaccination side effects recovery',
        'Ophthalmology eye surgery and eye strain rest',
        'Scheduled medical health checkup and endoscopy',
        'Spinal lower-back strain and bed rest'
      ],
      'Casual Leave': [
        'Urgent property registration and legal paperwork',
        'Bank loan processing and government ID documentation',
        'Child school admission and parent interview',
        'Home plumbing and electrical emergency maintenance',
        'Attending college reunion ceremony',
        'Vehicle mechanical breakdown repair and inspection',
        'Attending close friend engagement ceremony',
        'Urgent domestic civil affairs'
      ],
      'Comp Off': [
        'Compensatory off for production deployment on Saturday',
        'Compensatory off for database migration overnight support',
        'Compensatory off for disaster recovery drill on weekend',
        'Compensatory off for client demo preparation on Sunday',
        'Compensatory off for cloud infrastructure maintenance window'
      ],
      'Parental Leave': [
        'Maternity leave and newborn postpartum recovery',
        'Paternity leave to care for newborn child and spouse',
        'Parental bonding leave for infant childcare',
        'Adoption leave and child transition care'
      ],
      'Unpaid Leave': [
        'Personal sabbatical for professional certification exams',
        'Unpaid leave for overseas volunteer humanitarian project',
        'Extended unpaid travel for personal spiritual retreat',
        'Family agricultural harvest season assistance'
      ],
      'Bereavement Leave': [
        'Demise of grandmother and funeral ceremonies',
        'Demise of immediate family member and bereavement rituals',
        'Attending memorial service and family support'
      ]
    };

    const typeKeys = Object.keys(REASON_TEMPLATES);
    let insertedTimeOffCount = 0;

    // Distribute 100 requests across diverse employees, dates, types, and statuses
    for (let i = 0; i < 100; i++) {
      // Pick employee evenly across departments
      const emp = employees[(i * 7 + 3) % employees.length];
      
      // Determine Type (weighted: PTO 30%, Sick 25%, Casual 20%, Comp Off 10%, Parental 5%, Unpaid 5%, Bereavement 5%)
      let typeName;
      const typeMod = i % 20;
      if (typeMod < 6) typeName = 'Paid Time Off';
      else if (typeMod < 11) typeName = 'Sick Leave';
      else if (typeMod < 15) typeName = 'Casual Leave';
      else if (typeMod < 17) typeName = 'Comp Off';
      else if (typeMod === 17) typeName = 'Parental Leave';
      else if (typeMod === 18) typeName = 'Unpaid Leave';
      else typeName = 'Bereavement Leave';

      const typeObj = typeMap[typeName];

      // Determine Status:
      // ~48% Approved, ~32% To Approve (for interactive demo), ~12% Refused, ~8% Draft
      let status;
      const statusMod = i % 25;
      if (statusMod < 12) status = 'Approved';
      else if (statusMod < 20) status = 'To Approve';
      else if (statusMod < 23) status = 'Refused';
      else status = 'Draft';

      // Duration
      let duration;
      if (typeName === 'Comp Off') {
        duration = [4.00, 8.00][i % 2]; // 4 or 8 hours
      } else if (typeName === 'Parental Leave') {
        duration = [10.00, 15.00, 20.00][i % 3];
      } else if (typeName === 'Bereavement Leave') {
        duration = [3.00, 5.00][i % 2];
      } else {
        duration = (1 + (i % 4)); // 1 to 4 days
      }

      // Date calculation (August, September, or October 2026)
      const monthNum = 8 + (i % 3); // 8, 9, 10
      const monthStr = String(monthNum).padStart(2, '0');
      const dayNum = 1 + ((i * 3 + 2) % 25);
      const startDayStr = String(dayNum).padStart(2, '0');
      const startDate = `2026-${monthStr}-${startDayStr}`;
      
      // End date
      const endDayNum = Math.min(28, dayNum + Math.floor(duration) - 1);
      const endDayStr = String(endDayNum).padStart(2, '0');
      const endDate = `2026-${monthStr}-${endDayStr}`;

      // Reason
      const reasonsList = REASON_TEMPLATES[typeName];
      const reason = reasonsList[i % reasonsList.length];

      // Allocation
      let allocationId = null;
      if (typeObj.requires_allocation) {
        allocationId = await getAllocationId(emp.id, typeObj.id);
      }

      // Approver
      const approverId = (status === 'Approved' || status === 'Refused') ? 1 : null;

      await client.query(`
        INSERT INTO time_off_requests (
          employee_id, time_off_type_id, start_date, end_date,
          duration, status, reason, approver_id, allocation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        emp.id,
        typeObj.id,
        startDate,
        endDate,
        duration,
        status,
        reason,
        approverId,
        allocationId
      ]);

      insertedTimeOffCount++;
    }
    console.log(`Successfully generated ${insertedTimeOffCount} realistic Time Off Requests.`);

    // 5. Enrich Attendances to Cover All Types & Anomalies
    console.log('--- Enriching Attendance Records (All Types: Present, Late, Absent, On Leave) ---');

    // Get all attendances currently in DB
    const allAttRes = await client.query('SELECT id, employee_id, attendance_date, status FROM attendances ORDER BY id ASC');
    const allAtt = allAttRes.rows;
    console.log(`Total existing attendance rows: ${allAtt.length}`);

    // We will update:
    // ~120 records to 'Late'
    // ~60 records to 'Absent'
    // ~60 records to 'On Leave'
    // ~20 records to have missing checkouts (In Progress / Anomaly)
    // ~80 records to have overtime (1.5 - 3.5 hrs)

    let lateCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let missingCheckoutCount = 0;
    let overtimeCount = 0;

    for (let idx = 0; idx < allAtt.length; idx++) {
      const att = allAtt[idx];
      const dateStr = att.attendance_date.toISOString().split('T')[0];

      // 1. Late Arrival (~120 records: roughly 1 in 15 records)
      if (idx % 15 === 3 && lateCount < 120) {
        const lateMinute = String(20 + (idx % 35)).padStart(2, '0');
        const checkIn = `${dateStr}T09:${lateMinute}:00.000Z`;
        const checkOut = `${dateStr}T18:30:00.000Z`;
        await client.query(`
          UPDATE attendances
          SET status = 'Late',
              check_in_at = $1,
              check_out_at = $2,
              notes = 'Late arrival due to morning commute congestion'
          WHERE id = $3
        `, [checkIn, checkOut, att.id]);
        lateCount++;
      }
      // 2. Absent (~60 records: roughly 1 in 30 records)
      else if (idx % 30 === 7 && absentCount < 60) {
        await client.query(`
          UPDATE attendances
          SET status = 'Absent',
              check_in_at = NULL,
              check_out_at = NULL,
              overtime_hours = 0.00,
              notes = 'Unplanned absence / sick notice'
          WHERE id = $1
        `, [att.id]);
        absentCount++;
      }
      // 3. On Leave (~60 records: roughly 1 in 30 records)
      else if (idx % 30 === 13 && leaveCount < 60) {
        await client.query(`
          UPDATE attendances
          SET status = 'On Leave',
              check_in_at = NULL,
              check_out_at = NULL,
              overtime_hours = 0.00,
              notes = 'Approved statutory / annual leave'
          WHERE id = $1
        `, [att.id]);
        leaveCount++;
      }
      // 4. Missing Check-Out Anomaly (~20 records)
      else if (idx % 85 === 19 && missingCheckoutCount < 20) {
        const checkIn = `${dateStr}T08:50:00.000Z`;
        await client.query(`
          UPDATE attendances
          SET status = 'Present',
              check_in_at = $1,
              check_out_at = NULL,
              notes = 'Active session / missing checkout punch'
          WHERE id = $2
        `, [checkIn, att.id]);
        missingCheckoutCount++;
      }
      // 5. Overtime Hours (~80 records)
      else if (idx % 22 === 5 && overtimeCount < 80) {
        const otHours = (1.5 + ((idx % 5) * 0.5)).toFixed(2);
        const outHour = 19 + Math.floor(otHours);
        const checkOut = `${dateStr}T${outHour}:30:00.000Z`;
        await client.query(`
          UPDATE attendances
          SET overtime_hours = $1,
              check_out_at = $2,
              notes = 'Approved overtime for release sprint'
          WHERE id = $3
        `, [otHours, checkOut, att.id]);
        overtimeCount++;
      }
    }

    console.log(`Updated Attendance Distribution:
      - Late: ${lateCount}
      - Absent: ${absentCount}
      - On Leave: ${leaveCount}
      - Missing Checkouts: ${missingCheckoutCount}
      - Overtime Records: ${overtimeCount}
    `);

    // 6. Add Attendance for Today (2026-09-06) & Yesterday (2026-09-05) if not already inserted
    const recentDates = ['2026-09-05', '2026-09-06'];
    for (const rDate of recentDates) {
      for (const emp of employees) {
        // Check if attendance already exists
        const exists = await client.query('SELECT id FROM attendances WHERE employee_id = $1 AND attendance_date = $2', [emp.id, rDate]);
        if (exists.rows.length === 0) {
          const mod = (emp.id + (rDate === '2026-09-06' ? 2 : 0)) % 25;
          let status = 'Present';
          let checkIn = `${rDate}T08:55:00.000Z`;
          let checkOut = `${rDate}T17:30:00.000Z`;
          let ot = 0.00;
          let notes = null;

          if (mod === 0 || mod === 1) {
            status = 'Late';
            checkIn = `${rDate}T09:40:00.000Z`;
            notes = 'Late check-in';
          } else if (mod === 2) {
            status = 'Absent';
            checkIn = null;
            checkOut = null;
            notes = 'Absent';
          } else if (mod === 3) {
            status = 'On Leave';
            checkIn = null;
            checkOut = null;
            notes = 'On Leave';
          } else if (mod === 4 && rDate === '2026-09-06') {
            // In progress today
            status = 'Present';
            checkIn = `${rDate}T09:00:00.000Z`;
            checkOut = null;
          } else if (mod === 5) {
            ot = 2.00;
            checkOut = `${rDate}T19:30:00.000Z`;
            notes = 'Overtime';
          }

          await client.query(`
            INSERT INTO attendances (
              employee_id, attendance_date, check_in_at, check_out_at, overtime_hours, status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [emp.id, rDate, checkIn, checkOut, ot, status, notes]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('=== SEEDING COMPLETED SUCCESSFULLY WITH COMMIT ===');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding data, rolled back transaction:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});
