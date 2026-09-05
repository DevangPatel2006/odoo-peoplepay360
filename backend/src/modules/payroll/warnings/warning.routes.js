import { Router } from 'express';
import warningService from './warning.service.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { ok } from '../../../common/utils/apiResponse.js';

const router = Router();

router.use(authenticate);

router.patch('/:id/resolve', requirePermission('Payruns', 'update'), async (req, res) => {
  const warning = await warningService.resolveWarning(req.params.id);
  return ok(res, warning);
});

export default router;
