import request from 'supertest';
import app from '../src/app.js';
import { query, pool } from '../src/config/db.js';

export const getAuthToken = async (email = 'admin@peoplepay360.com', password = 'Password123!') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ work_email: email, password });

  if (!res.body || !res.body.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }

  return res.body.data.token;
};

export const closeDb = async () => {
  await pool.end();
};

export { app, query, request };
