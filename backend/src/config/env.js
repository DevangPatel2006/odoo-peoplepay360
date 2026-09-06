import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt loading from backend directory or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  db: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT, 10) || 5432,
    database: process.env.PGDATABASE || 'peoplepay360',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    connectionString: process.env.DATABASE_URL || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-peoplepay360-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  security: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
  pagination: {
    defaultPageSize: parseInt(process.env.PAGINATION_DEFAULT_PAGE_SIZE, 10) || 20,
    maxPageSize: parseInt(process.env.PAGINATION_MAX_PAGE_SIZE, 10) || 100,
  },
  pdf: {
    outputDir: path.resolve(__dirname, '../../../', process.env.PDF_OUTPUT_DIR || 'storage/payslips'),
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@peoplepay360.com',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export default env;
