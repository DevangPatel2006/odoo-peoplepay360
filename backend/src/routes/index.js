import { Router } from 'express';
import { query } from '../config/db.js';
import { ok } from '../common/utils/apiResponse.js';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  let dbHealthy = false;
  try {
    await query('SELECT 1');
    dbHealthy = true;
  } catch (err) {
    dbHealthy = false;
  }

  return ok(res, {
    status: 'ok',
    db: dbHealthy,
  });
});

export default router;
