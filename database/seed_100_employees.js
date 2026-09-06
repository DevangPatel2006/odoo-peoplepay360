import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'peoplepay360',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'devang2006'
});

// 131 Distinct Authentic Human Names (plus Admin #1 = 132 total)
const REAL_NAMES = [
  { first: 'Alexander', last: 'Smith', gender: 'Male' },
  { first: 'Sophia', last: 'Johnson', gender: 'Female' },
  { first: 'Liam', last: 'Williams', gender: 'Male' },
  { first: 'Olivia', last: 'Brown', gender: 'Female' },
  { first: 'Noah', last: 'Jones', gender: 'Male' },
  { first: 'Emma', last: 'Garcia', gender: 'Female' },
  { first: 'Lucas', last: 'Miller', gender: 'Male' },
  { first: 'Mia', last: 'Davis', gender: 'Female' },
  { first: 'Ethan', last: 'Rodriguez', gender: 'Male' },
  { first: 'Isabella', last: 'Martinez', gender: 'Female' },
  { first: 'Mason', last: 'Hernandez', gender: 'Male' },
  { first: 'Charlotte', last: 'Lopez', gender: 'Female' },
  { first: 'Logan', last: 'Gonzalez', gender: 'Male' },
  { first: 'Amelia', last: 'Wilson', gender: 'Female' },
  { first: 'James', last: 'Anderson', gender: 'Male' },
  { first: 'Harper', last: 'Thomas', gender: 'Female' },
  { first: 'Benjamin', last: 'Taylor', gender: 'Male' },
  { first: 'Evelyn', last: 'Moore', gender: 'Female' },
  { first: 'Jacob', last: 'Jackson', gender: 'Male' },
  { first: 'Abigail', last: 'Martin', gender: 'Female' },
  { first: 'Michael', last: 'Lee', gender: 'Male' },
  { first: 'Emily', last: 'Perez', gender: 'Female' },
  { first: 'Elijah', last: 'Thompson', gender: 'Male' },
  { first: 'Elizabeth', last: 'White', gender: 'Female' },
  { first: 'Daniel', last: 'Harris', gender: 'Male' },
  { first: 'Mila', last: 'Sanchez', gender: 'Female' },
  { first: 'Matthew', last: 'Clark', gender: 'Male' },
  { first: 'Ella', last: 'Ramirez', gender: 'Female' },
  { first: 'Henry', last: 'Lewis', gender: 'Male' },
  { first: 'Avery', last: 'Robinson', gender: 'Female' },
  { first: 'Jackson', last: 'Walker', gender: 'Male' },
  { first: 'Sofia', last: 'Young', gender: 'Female' },
  { first: 'Sebastian', last: 'Allen', gender: 'Male' },
  { first: 'Camila', last: 'King', gender: 'Female' },
  { first: 'Aiden', last: 'Wright', gender: 'Male' },
  { first: 'Aria', last: 'Scott', gender: 'Female' },
  { first: 'David', last: 'Torres', gender: 'Male' },
  { first: 'Scarlett', last: 'Nguyen', gender: 'Female' },
  { first: 'Joseph', last: 'Hill', gender: 'Male' },
  { first: 'Victoria', last: 'Flores', gender: 'Female' },
  { first: 'Carter', last: 'Green', gender: 'Male' },
  { first: 'Madison', last: 'Adams', gender: 'Female' },
  { first: 'Owen', last: 'Nelson', gender: 'Male' },
  { first: 'Luna', last: 'Baker', gender: 'Female' },
  { first: 'Wyatt', last: 'Hall', gender: 'Male' },
  { first: 'Grace', last: 'Rivera', gender: 'Female' },
  { first: 'John', last: 'Campbell', gender: 'Male' },
  { first: 'Chloe', last: 'Mitchell', gender: 'Female' },
  { first: 'Jack', last: 'Carter', gender: 'Male' },
  { first: 'Penelope', last: 'Roberts', gender: 'Female' },
  { first: 'Luke', last: 'Gomez', gender: 'Male' },
  { first: 'Layla', last: 'Phillips', gender: 'Female' },
  { first: 'Jayden', last: 'Evans', gender: 'Male' },
  { first: 'Riley', last: 'Turner', gender: 'Female' },
  { first: 'Dylan', last: 'Diaz', gender: 'Male' },
  { first: 'Zoey', last: 'Parker', gender: 'Female' },
  { first: 'Grayson', last: 'Cruz', gender: 'Male' },
  { first: 'Nora', last: 'Edwards', gender: 'Female' },
  { first: 'Levi', last: 'Collins', gender: 'Male' },
  { first: 'Lily', last: 'Reyes', gender: 'Female' },
  { first: 'Isaac', last: 'Stewart', gender: 'Male' },
  { first: 'Eleanor', last: 'Morris', gender: 'Female' },
  { first: 'Gabriel', last: 'Morales', gender: 'Male' },
  { first: 'Hannah', last: 'Murphy', gender: 'Female' },
  { first: 'Julian', last: 'Cook', gender: 'Male' },
  { first: 'Lillian', last: 'Rogers', gender: 'Female' },
  { first: 'Mateo', last: 'Gutierrez', gender: 'Male' },
  { first: 'Addison', last: 'Ortiz', gender: 'Female' },
  { first: 'Anthony', last: 'Morgan', gender: 'Male' },
  { first: 'Aubrey', last: 'Cooper', gender: 'Female' },
  { first: 'Jaxon', last: 'Peterson', gender: 'Male' },
  { first: 'Ellie', last: 'Bailey', gender: 'Female' },
  { first: 'Lincoln', last: 'Reed', gender: 'Male' },
  { first: 'Stella', last: 'Kelly', gender: 'Female' },
  { first: 'Joshua', last: 'Howard', gender: 'Male' },
  { first: 'Natalie', last: 'Ramos', gender: 'Female' },
  { first: 'Christopher', last: 'Kim', gender: 'Male' },
  { first: 'Zoe', last: 'Cox', gender: 'Female' },
  { first: 'Andrew', last: 'Ward', gender: 'Male' },
  { first: 'Leah', last: 'Richardson', gender: 'Female' },
  { first: 'Theodore', last: 'Watson', gender: 'Male' },
  { first: 'Hazel', last: 'Brooks', gender: 'Female' },
  { first: 'Caleb', last: 'Chavez', gender: 'Male' },
  { first: 'Violet', last: 'Wood', gender: 'Female' },
  { first: 'Ryan', last: 'James', gender: 'Male' },
  { first: 'Aurora', last: 'Bennett', gender: 'Female' },
  { first: 'Asher', last: 'Gray', gender: 'Male' },
  { first: 'Savannah', last: 'Mendoza', gender: 'Female' },
  { first: 'Nathan', last: 'Ruiz', gender: 'Male' },
  { first: 'Audrey', last: 'Hughes', gender: 'Female' },
  { first: 'Thomas', last: 'Price', gender: 'Male' },
  { first: 'Brooklyn', last: 'Alvarez', gender: 'Female' },
  { first: 'Leo', last: 'Castillo', gender: 'Male' },
  { first: 'Bella', last: 'Sanders', gender: 'Female' },
  { first: 'Isaiah', last: 'Patel', gender: 'Male' },
  { first: 'Claire', last: 'Myers', gender: 'Female' },
  { first: 'Charles', last: 'Long', gender: 'Male' },
  { first: 'Skylar', last: 'Ross', gender: 'Female' },
  { first: 'Josiah', last: 'Foster', gender: 'Male' },
  { first: 'Lucy', last: 'Jimenez', gender: 'Female' },
  { first: 'Christian', last: 'Powell', gender: 'Male' },
  { first: 'Anna', last: 'Jenkins', gender: 'Female' },
  { first: 'Hunter', last: 'Perry', gender: 'Male' },
  { first: 'Caroline', last: 'Russell', gender: 'Female' },
  { first: 'Connor', last: 'Sullivan', gender: 'Male' },
  { first: 'Nova', last: 'Bell', gender: 'Female' },
  { first: 'Eli', last: 'Coleman', gender: 'Male' },
  { first: 'Genesis', last: 'Butler', gender: 'Female' },
  { first: 'Aaron', last: 'Henderson', gender: 'Male' },
  { first: 'Kennedy', last: 'Barnes', gender: 'Female' },
  { first: 'Landon', last: 'Gonzales', gender: 'Male' },
  { first: 'Samantha', last: 'Fisher', gender: 'Female' },
  { first: 'Adrian', last: 'Vasquez', gender: 'Male' },
  { first: 'Maya', last: 'Simmons', gender: 'Female' },
  { first: 'Jonathan', last: 'Romero', gender: 'Male' },
  { first: 'Willow', last: 'Jordan', gender: 'Female' },
  { first: 'Nolan', last: 'Patterson', gender: 'Male' },
  { first: 'Kinsley', last: 'Alexander', gender: 'Female' },
  { first: 'Jeremiah', last: 'Hamilton', gender: 'Male' },
  { first: 'Naomi', last: 'Graham', gender: 'Female' },
  { first: 'Easton', last: 'Reynolds', gender: 'Male' },
  { first: 'Aaliyah', last: 'Griffin', gender: 'Female' },
  { first: 'Colton', last: 'Wallace', gender: 'Male' },
  { first: 'Elena', last: 'Moretti', gender: 'Female' },
  { first: 'Cameron', last: 'Hayes', gender: 'Male' },
  { first: 'Sarah', last: 'Cole', gender: 'Female' },
  { first: 'Carson', last: 'West', gender: 'Male' },
  { first: 'Allison', last: 'Jordan', gender: 'Female' },
  { first: 'Robert', last: 'Ortiz', gender: 'Male' },
  { first: 'Gabriella', last: 'Silva', gender: 'Female' },
  { first: 'Dominic', last: 'Vance', gender: 'Male' }
];

const LOCATIONS = [
  'Headquarters (New York)',
  'San Francisco Hub',
  'Austin Tech Center',
  'Remote (US)',
  'Chicago Regional Office',
  'Seattle Engineering Office'
];

const BANKS = [
  { name: 'JPMorgan Chase', swift: 'CHASUS33' },
  { name: 'Bank of America', swift: 'BOFAUS3N' },
  { name: 'Wells Fargo', swift: 'WFBIUS6S' },
  { name: 'Citibank', swift: 'CITIUS33' },
  { name: 'PNC Bank', swift: 'PNCCUS33' }
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('>>> Commencing Seeding of 132 Diverse Employees Across All Departments & Types...');
    await client.query('BEGIN');

    // 1. Ensure All 5 Departments Exist
    console.log('--- Ensuring All 5 Departments Exist ---');
    await client.query(`
      INSERT INTO departments (id, company_id, name, parent_department_id)
      VALUES (5, 1, 'Finance & Accounting', 1)
      ON CONFLICT (id) DO UPDATE SET name = 'Finance & Accounting';
    `);
    await client.query("SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments))");

    // 2. Ensure Job Positions Exist in Each of the 5 Departments
    console.log('--- Checking & Expanding Job Positions ---');
    const positionsData = [
      // Executive (Dept 1)
      { deptId: 1, title: 'Chief Executive Officer' },
      { deptId: 1, title: 'Chief Technology Officer' },
      { deptId: 1, title: 'Chief Operating Officer' },
      { deptId: 1, title: 'Chief Financial Officer' },
      { deptId: 1, title: 'VP of Engineering' },
      { deptId: 1, title: 'VP of Product' },
      { deptId: 1, title: 'Director of Corporate Strategy' },
      // Human Resources (Dept 2)
      { deptId: 2, title: 'HR Manager' },
      { deptId: 2, title: 'Payroll Specialist' },
      { deptId: 2, title: 'Senior Talent Acquisition Lead' },
      { deptId: 2, title: 'People Operations Specialist' },
      { deptId: 2, title: 'HR Business Partner' },
      { deptId: 2, title: 'Compensation & Benefits Analyst' },
      // Engineering (Dept 3)
      { deptId: 3, title: 'Senior Software Engineer' },
      { deptId: 3, title: 'Fullstack Developer' },
      { deptId: 3, title: 'Principal Architect' },
      { deptId: 3, title: 'DevOps & Cloud Platform Lead' },
      { deptId: 3, title: 'Frontend Specialist' },
      { deptId: 3, title: 'Backend Systems Engineer' },
      { deptId: 3, title: 'QA Automation Engineer' },
      { deptId: 3, title: 'Data Platform Engineer' },
      { deptId: 3, title: 'Mobile Application Developer' },
      { deptId: 3, title: 'Engineering Manager' },
      // Sales & Marketing (Dept 4)
      { deptId: 4, title: 'Sales Executive' },
      { deptId: 4, title: 'Enterprise Account Executive' },
      { deptId: 4, title: 'Director of Marketing' },
      { deptId: 4, title: 'Growth Marketing Specialist' },
      { deptId: 4, title: 'Customer Success Manager' },
      { deptId: 4, title: 'Strategic Partnerships Lead' },
      { deptId: 4, title: 'Content Marketing Strategist' },
      // Finance & Accounting (Dept 5)
      { deptId: 5, title: 'Financial Controller' },
      { deptId: 5, title: 'Senior Accountant' },
      { deptId: 5, title: 'Financial Analyst' },
      { deptId: 5, title: 'Accounts Payable Specialist' },
      { deptId: 5, title: 'Payroll & Tax Accountant' },
      { deptId: 5, title: 'Corporate FP&A Specialist' }
    ];

    for (const pos of positionsData) {
      await client.query(`
        INSERT INTO job_positions (company_id, department_id, title)
        VALUES (1, $1, $2)
        ON CONFLICT DO NOTHING
      `, [pos.deptId, pos.title]);
    }

    const posRes = await client.query('SELECT id, department_id, title FROM job_positions');
    const positionsByDept = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const p of posRes.rows) {
      if (positionsByDept[p.department_id]) {
        positionsByDept[p.department_id].push(p.id);
      }
    }

    // 3. Clean up non-admin dummy data to avoid foreign key collisions
    console.log('--- Cleaning Up Obsolete Test Rows (Preserving Admin User #1) ---');
    await client.query("SET session_replication_role = 'replica'");
    await client.query('DELETE FROM payroll_warnings');
    await client.query('DELETE FROM payslip_lines');
    await client.query('DELETE FROM payslips');
    await client.query('DELETE FROM payrun_employees');
    await client.query('DELETE FROM payruns');
    await client.query('DELETE FROM time_off_requests');
    await client.query('DELETE FROM time_off_allocations');
    await client.query('DELETE FROM attendances');
    await client.query('DELETE FROM contracts');
    await client.query('DELETE FROM user_roles WHERE user_id > 1');
    await client.query('DELETE FROM users WHERE id > 1');
    await client.query('DELETE FROM employees WHERE id > 1');
    await client.query("SET session_replication_role = 'origin'");

    // Reset sequence for employees
    await client.query("SELECT setval('employees_id_seq', 1)");

    // 4. Plan the Interleaved Department and Employee Type Distribution
    // Total Employees: 132
    // Admin #1: Executive (Dept 1), Full-time
    // Remaining 131 Employees:
    // Departments:
    // - Engineering (3): 44
    // - Sales & Marketing (4): 32
    // - Finance & Accounting (5): 22
    // - Human Resources (2): 18
    // - Executive (1): 15 (+ Admin = 16)
    // Types:
    // - Full-time: 75 (+ Admin = 76)
    // - Part-time: 24
    // - Contract: 20
    // - Intern: 12
    console.log('--- Generating Interleaved Specifications for 131 Employees ---');

    const deptQuotas = { 3: 44, 4: 32, 5: 22, 2: 18, 1: 15 };
    const deptCycle = [3, 4, 5, 2, 1];
    const assignedDepts = [];

    let cycleIndex = 0;
    while (assignedDepts.length < 131) {
      let found = false;
      for (let attempt = 0; attempt < deptCycle.length; attempt++) {
        const candidateDept = deptCycle[(cycleIndex + attempt) % deptCycle.length];
        if (deptQuotas[candidateDept] > 0) {
          assignedDepts.push(candidateDept);
          deptQuotas[candidateDept]--;
          cycleIndex = (cycleIndex + attempt + 1) % deptCycle.length;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    const typeQuotas = { 'Full-time': 75, 'Part-time': 24, 'Contract': 20, 'Intern': 12 };
    // Pattern to balance variety across every single page:
    const typeCycle = ['Full-time', 'Part-time', 'Full-time', 'Contract', 'Full-time', 'Intern', 'Full-time'];
    const assignedTypes = [];

    let typeCycleIdx = 0;
    while (assignedTypes.length < 131) {
      let found = false;
      for (let attempt = 0; attempt < typeCycle.length; attempt++) {
        const candidateType = typeCycle[(typeCycleIdx + attempt) % typeCycle.length];
        if (typeQuotas[candidateType] > 0) {
          assignedTypes.push(candidateType);
          typeQuotas[candidateType]--;
          typeCycleIdx = (typeCycleIdx + attempt + 1) % typeCycle.length;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    // 5. Insert Admin Employee #1
    console.log('--- Setting Up Root Admin Employee #1 ---');
    await client.query(`
      UPDATE employees SET
        first_name = 'Devang',
        last_name = 'Patel',
        employee_code = 'EMP-0001',
        work_email = 'admin@peoplepay360.com',
        department_id = 1,
        job_position_id = ${positionsByDept[1][0] || 1},
        employee_type = 'Full-time',
        status = 'Active'
      WHERE id = 1
    `);

    // Insert Contract for Admin #1
    await client.query(`
      INSERT INTO contracts (
        contract_number, employee_id, department_id, job_position_id,
        working_schedule_id, salary_structure_id, wage_per_month, start_date, status
      ) VALUES (
        'CNT-2026-0001', 1, 1, ${positionsByDept[1][0] || 1},
        1, 1, 17500.00, '2024-01-01', 'Running'
      ) ON CONFLICT (contract_number) DO UPDATE SET status = 'Running', wage_per_month = 17500.00
    `);

    // Allocations for Employee #1
    await client.query(`
      INSERT INTO time_off_allocations (
        employee_id, time_off_type_id, allocated_amount, taken_amount,
        status, validity_start, validity_end, description
      ) VALUES 
      (1, 1, 20.00, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Annual Paid Time Off Allocation'),
      (1, 2, 10.00, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Annual Medical & Sick Leave')
    `);

    const insertedEmployees = [
      { id: 1, deptId: 1, name: 'Devang Patel', type: 'Full-time', wage: 17500 }
    ];

    // 6. Insert the 131 Additional Diverse Employees (Total 132)
    console.log('--- Inserting 131 Interleaved Diverse Employees ---');
    for (let i = 0; i < 131; i++) {
      const person = REAL_NAMES[i % REAL_NAMES.length];
      const deptId = assignedDepts[i];
      const empType = assignedTypes[i];
      const empCode = `EMP-${String(100 + i + 2).padStart(4, '0')}`;
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}${i >= REAL_NAMES.length ? i : ''}@peoplepay360.com`;
      const phone = `+1-555-${String(1000 + i).slice(-4)}`;
      const location = LOCATIONS[i % LOCATIONS.length];
      const bank = BANKS[i % BANKS.length];
      const bankAcc = `US${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      // Calculate realistic wage depending on department & employment type
      let wage = 6000;
      if (empType === 'Intern') {
        wage = 2000 + ((i * 50) % 800); // 2000 - 2800
      } else if (empType === 'Part-time') {
        if (deptId === 1) wage = 5500 + ((i * 100) % 1500);
        else if (deptId === 3) wage = 4500 + ((i * 90) % 1500);
        else if (deptId === 5) wage = 4200 + ((i * 80) % 1200);
        else wage = 3400 + ((i * 70) % 1100);
      } else if (empType === 'Contract') {
        if (deptId === 1) wage = 9000 + ((i * 120) % 2000);
        else if (deptId === 3) wage = 7500 + ((i * 130) % 2200);
        else if (deptId === 5) wage = 6500 + ((i * 100) % 1800);
        else wage = 5200 + ((i * 90) % 1600);
      } else {
        // Full-time
        if (deptId === 1) wage = 13500 + ((i * 200) % 4500); // Executive: 13,500 - 18,000
        else if (deptId === 3) wage = 8500 + ((i * 140) % 4500); // Engineering: 8,500 - 13,000
        else if (deptId === 5) wage = 7200 + ((i * 120) % 3800); // Finance: 7,200 - 11,000
        else if (deptId === 4) wage = 6500 + ((i * 110) % 3200); // Sales: 6,500 - 9,700
        else wage = 5800 + ((i * 100) % 2800); // HR: 5,800 - 8,600
      }

      const deptPositions = positionsByDept[deptId] || [1];
      const jobPosId = deptPositions[i % deptPositions.length];

      // Staggered join dates between 2024 and mid-2026
      const joinYear = 2024 + (i % 3);
      const joinMonth = String(1 + (i % 12)).padStart(2, '0');
      const joinDay = String(1 + (i % 25)).padStart(2, '0');
      const joinDate = `${joinYear}-${joinMonth}-${joinDay}`;
      const birthYear = 1985 + (i % 16);
      const birthDate = `${birthYear}-0${1 + (i % 9)}-15`;

      const empRes = await client.query(`
        INSERT INTO employees (
          company_id, employee_code, first_name, last_name, work_email,
          personal_phone, department_id, job_position_id, working_schedule_id,
          work_location, employee_type, status, date_of_joining, date_of_birth,
          gender, bank_account_number, bank_name, bank_ifsc_or_swift
        ) VALUES (
          1, $1, $2, $3, $4,
          $5, $6, $7, 1,
          $8, $9, 'Active', $10, $11,
          $12, $13, $14, $15
        ) RETURNING id
      `, [
        empCode, person.first, person.last, email,
        phone, deptId, jobPosId,
        location, empType, joinDate, birthDate,
        person.gender, bankAcc, bank.name, bank.swift
      ]);

      const empId = empRes.rows[0].id;
      insertedEmployees.push({
        id: empId,
        deptId,
        name: `${person.first} ${person.last}`,
        type: empType,
        wage
      });

      // 7. Insert Running Contract for Each Employee
      const contractNumber = `CNT-2026-${String(empId).padStart(4, '0')}`;
      await client.query(`
        INSERT INTO contracts (
          contract_number, employee_id, department_id, job_position_id,
          working_schedule_id, salary_structure_id, wage_per_month, start_date, status
        ) VALUES (
          $1, $2, $3, $4,
          1, 1, $5, $6, 'Running'
        )
      `, [contractNumber, empId, deptId, jobPosId, wage, joinDate]);

      // 8. Time Off Allocations
      const ptoDays = (empType === 'Intern') ? 10.00 : (empType === 'Part-time') ? 12.00 : 20.00;
      const sickDays = (empType === 'Intern') ? 5.00 : 10.00;
      await client.query(`
        INSERT INTO time_off_allocations (
          employee_id, time_off_type_id, allocated_amount, taken_amount,
          status, validity_start, validity_end, description
        ) VALUES 
        ($1, 1, $2, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Standard PTO Allocation'),
        ($1, 2, $3, 0.00, 'Approved', '2026-01-01', '2026-12-31', 'Medical & Health Leave')
      `, [empId, ptoDays, sickDays]);
    }

    // 9. Generate Realistic Time Off Requests (~28 distributed requests)
    console.log('--- Generating Realistic Time Off Requests ---');
    for (let r = 0; r < 28; r++) {
      const targetEmp = insertedEmployees[(r * 5) % insertedEmployees.length];
      const typeId = (r % 3 === 0) ? 2 : 1; // 1: PTO, 2: Sick Leave
      const days = 1 + (r % 4);
      const isPast = r < 20;
      const reqStatus = isPast ? 'Approved' : (r % 2 === 0 ? 'To Approve' : 'Approved');
      const startDay = String(1 + ((r * 3) % 25)).padStart(2, '0');
      const month = isPast ? '08' : '09';
      const startDate = `2026-${month}-${startDay}`;
      const endDay = String(parseInt(startDay, 10) + days - 1).padStart(2, '0');
      const endDate = `2026-${month}-${endDay}`;

      await client.query(`
        INSERT INTO time_off_requests (
          employee_id, time_off_type_id, start_date, end_date,
          duration, status, reason, approver_id
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8
        )
      `, [
        targetEmp.id, typeId, startDate, endDate,
        days, reqStatus,
        typeId === 2 ? 'Doctor recommended medical consultation & recovery' : 'Personal family vacation and recharge',
        reqStatus === 'Approved' ? 1 : null
      ]);
    }

    // 10. Generate High-Fidelity Attendance Records (Past 14 Working Days)
    console.log('--- Generating Attendance Records for All Active Employees ---');
    const attendanceDates = [
      '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22',
      '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29',
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'
    ];

    for (const attDate of attendanceDates) {
      for (const emp of insertedEmployees) {
        // Attendance probability based on type (96% for FT/Contract, 75% for PT)
        if (emp.type === 'Part-time' && (emp.id % 4 === 0)) continue;
        
        const inMinute = String(45 + (emp.id % 14)).padStart(2, '0');
        const outMinute = String(10 + (emp.id % 45)).padStart(2, '0');
        const checkIn = `${attDate}T08:${inMinute}:00.000Z`;
        const checkOut = `${attDate}T17:${outMinute}:00.000Z`;
        const workedHours = 8.0 + ((emp.id % 7) * 0.1);

        await client.query(`
          INSERT INTO attendances (
            employee_id, attendance_date, check_in_at, check_out_at, overtime_hours, status
          ) VALUES (
            $1, $2, $3, $4, 0.00, 'Present'
          )
        `, [emp.id, attDate, checkIn, checkOut]);
      }
    }

    // 11. Generate Multi-Department August and September Payruns
    console.log('--- Generating August and September Multi-Department Payruns ---');
    
    // August Payrun
    const augRes = await client.query(`
      INSERT INTO payruns (
        company_id, name, salary_structure_id, period_start, period_end, status, is_archived
      ) VALUES (
        1, 'August 2026 Regular Payrun', 1, '2026-08-01', '2026-08-31', 'Draft', false
      ) RETURNING id
    `);
    const augPayrunId = augRes.rows[0].id;

    // September Payrun
    const sepRes = await client.query(`
      INSERT INTO payruns (
        company_id, name, salary_structure_id, period_start, period_end, status, is_archived
      ) VALUES (
        1, 'September 2026 Regular Payrun', 1, '2026-09-01', '2026-09-30', 'Draft', false
      ) RETURNING id
    `);
    const sepPayrunId = sepRes.rows[0].id;

    // Balanced employee selection across ALL 5 DEPARTMENTS
    // Ensures Pie Chart has all 5 slices and monthly trend chart has full history!
    const engPool = insertedEmployees.filter(e => e.deptId === 3).slice(0, 22);
    const salesPool = insertedEmployees.filter(e => e.deptId === 4).slice(0, 16);
    const finPool = insertedEmployees.filter(e => e.deptId === 5).slice(0, 12);
    const hrPool = insertedEmployees.filter(e => e.deptId === 2).slice(0, 10);
    const execPool = insertedEmployees.filter(e => e.deptId === 1).slice(0, 8);
    const payrunEmployeesPool = [...engPool, ...salesPool, ...finPool, ...hrPool, ...execPool];

    for (const pRun of [
      { id: augPayrunId, start: '2026-08-01', end: '2026-08-31' },
      { id: sepPayrunId, start: '2026-09-01', end: '2026-09-30' }
    ]) {
      for (const emp of payrunEmployeesPool) {
        // Resolve contract
        const cRes = await client.query(`
          SELECT id, wage_per_month FROM contracts WHERE employee_id = $1 AND status = 'Running' LIMIT 1
        `, [emp.id]);
        if (cRes.rows.length === 0) continue;
        const contract = cRes.rows[0];

        // Link in payrun_employees
        await client.query(`
          INSERT INTO payrun_employees (payrun_id, employee_id, resolved_contract_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (payrun_id, employee_id) DO NOTHING
        `, [pRun.id, emp.id, contract.id]);

        // Insert Payslip
        const payslipRes = await client.query(`
          INSERT INTO payslips (
            payrun_id, employee_id, contract_id, salary_structure_id,
            period_start, period_end, worked_days, status
          ) VALUES (
            $1, $2, $3, 1,
            $4, $5, 22, 'Draft'
          ) RETURNING id
        `, [pRun.id, emp.id, contract.id, pRun.start, pRun.end]);

        const payslipId = payslipRes.rows[0].id;

        // Compute payslip via PostgreSQL stored engine function
        try {
          await client.query('SELECT compute_payslip($1)', [payslipId]);
        } catch (e) {
          console.warn(`Fallback manual compute for slip ${payslipId}:`, e.message);
          const gross = parseFloat(contract.wage_per_month);
          const net = Math.round(gross * 0.925 * 100) / 100;
          await client.query(`
            UPDATE payslips SET
              basic_amount = $1,
              gross_amount = $2,
              net_amount = $3,
              status = 'Computed'
            WHERE id = $4
          `, [gross * 0.5, gross, net, payslipId]);
        }
      }

      // Mark payrun and payslips as 'Paid'
      await client.query(`UPDATE payslips SET status = 'Paid' WHERE payrun_id = $1`, [pRun.id]);
      await client.query(`UPDATE payruns SET status = 'Paid' WHERE id = $1`, [pRun.id]);
    }

    await client.query('COMMIT');
    console.log('>>> Seeding Completed Successfully! All 132 employees, contracts, attendance, time off, and multi-department payruns are live.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding Failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

seed().then(() => pool.end());
