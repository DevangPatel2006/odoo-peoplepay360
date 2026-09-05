import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment from root .env
dotenv.config({ path: path.join(rootDir, '.env') });

const { Client } = pg;

const client = new Client({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  database: process.env.PGDATABASE || 'peoplepay360',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
});

const sqlFiles = [
  'schema.sql',
  'triggers_and_functions.sql',
  'views.sql',
  'migrations/002_hardening_fixes.sql',
  'migrations/003_bugfixes.sql',
  'seed/01_roles_and_permissions.sql',
  'seed/02_companies_departments_positions.sql',
  'seed/03_working_schedules.sql',
  'seed/04_employees.sql',
  'seed/05_salary_structures_rules.sql',
  'seed/06_time_off_types.sql',
  'seed/07_demo_users.sql',
];

async function bootstrap() {
  console.log('[db:bootstrap] Connecting to database:', {
    host: client.host,
    port: client.port,
    database: client.database,
    user: client.user,
  });

  await client.connect();
  console.log('[db:bootstrap] Connected successfully.');

  for (const file of sqlFiles) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[db:bootstrap] Warning: File ${file} not found, skipping.`);
      continue;
    }

    console.log(`[db:bootstrap] Executing: ${file}...`);
    const sql = fs.readFileSync(fullPath, 'utf8');
    await client.query(sql);
    console.log(`[db:bootstrap] Completed: ${file}`);

    // If we just finished schema/views, ensure base company & salary structure exist
    // so migration 002's self-contained verification block satisfies FK constraints
    if (file === 'views.sql') {
      await client.query(`
        INSERT INTO companies (id, name, currency_code) VALUES (1, 'PeoplePay Inc.', 'USD') ON CONFLICT (id) DO NOTHING;
        INSERT INTO salary_structures (id, company_id, name, structure_type) VALUES (1, 1, 'Regular Salary Structure', 'Regular') ON CONFLICT (id) DO NOTHING;
      `);
    }
  }

  console.log('[db:bootstrap] Database schema, migrations, and seed applied successfully!');
  await client.end();
}

bootstrap().catch((err) => {
  console.error('[db:bootstrap] Error executing bootstrap:', err);
  client.end().finally(() => process.exit(1));
});
