import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'peoplepay360',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'devang2006'
});

async function seedAllUsers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('--- Seeding User Accounts for All 132 Employees ---');

    // Fetch all employees
    const empRes = await client.query(`
      SELECT id, employee_code, first_name, last_name, work_email, department_id, job_position_id 
      FROM employees 
      ORDER BY id ASC
    `);
    const employees = empRes.rows;
    console.log(`Found ${employees.length} employees in database.`);

    const defaultPasswordHash = '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6'; // 'Password123!'

    let createdCount = 0;
    let existingCount = 0;

    for (const emp of employees) {
      // Check if user already exists for this employee or email
      const existingUser = await client.query(`
        SELECT id FROM users WHERE employee_id = $1 OR work_email = $2
      `, [emp.id, emp.work_email]);

      let userId;
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        // Make sure employee_id is linked
        await client.query(`UPDATE users SET employee_id = $1 WHERE id = $2`, [emp.id, userId]);
        existingCount++;
      } else {
        const uRes = await client.query(`
          INSERT INTO users (employee_id, work_email, password_hash, is_active)
          VALUES ($1, $2, $3, true)
          RETURNING id
        `, [emp.id, emp.work_email, defaultPasswordHash]);
        userId = uRes.rows[0].id;
        createdCount++;
      }

      // Determine appropriate role based on department / employee id
      // 1: Employee, 2: HR Manager, 3: HR Payroll User, 4: HR Payroll Manager, 5: Admin
      let roleId = 1; // Default: Employee
      if (emp.id === 1) {
        roleId = 5; // Admin
      } else if (emp.department_id === 1 && emp.id <= 6) {
        roleId = 5; // Executive Admins
      } else if (emp.department_id === 2 && emp.id <= 25) {
        roleId = 2; // HR Managers
      } else if (emp.department_id === 5 && emp.id <= 30) {
        roleId = 4; // HR Payroll Manager (Finance)
      } else if (emp.department_id === 2 || emp.department_id === 5) {
        roleId = 3; // HR Payroll User
      }

      // Check if role is assigned
      const urRes = await client.query(`
        SELECT id FROM user_roles WHERE user_id = $1
      `, [userId]);

      if (urRes.rows.length === 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [userId, roleId]);
      }
    }

    await client.query('COMMIT');
    console.log(`Successfully synced users! Existing: ${existingCount}, Newly created: ${createdCount}`);

    // Verify total counts
    const countUsers = await client.query('SELECT count(*) FROM users');
    const countUserRoles = await client.query('SELECT count(*) FROM user_roles');
    console.log(`Total users in DB: ${countUsers.rows[0].count}`);
    console.log(`Total user_roles in DB: ${countUserRoles.rows[0].count}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding users:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAllUsers();
