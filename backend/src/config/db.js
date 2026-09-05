import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const poolConfig = env.db.connectionString
  ? { connectionString: env.db.connectionString }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute a parameterized query using the connection pool
 * @param {string} text - SQL query string with $1, $2 placeholders
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
  return pool.query(text, params);
};

/**
 * Execute a set of database operations inside a single transactional context
 * @param {Function} callback - async (client) => { ... }
 * @returns {Promise<any>}
 */
export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  pool,
  query,
  withTransaction,
};
