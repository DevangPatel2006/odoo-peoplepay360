import { Router } from 'express';
import requestController from './request.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  createRequestSchema,
  updateRequestSchema,
  reviewRequestSchema,
  queryRequestSchema,
} from '../../../common/validators/timeOff.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('TimeOff', 'read'), validate(queryRequestSchema, 'query'), requestController.list);
router.get('/:id', requirePermission('TimeOff', 'read'), requestController.getById);
router.post('/', requirePermission('TimeOff', 'create'), validate(createRequestSchema), requestController.create);
router.delete('/:id', requirePermission('TimeOff', 'delete'), requestController.remove);

router.patch('/:id/approve', requirePermission('TimeOff', 'approve'), validate(reviewRequestSchema), requestController.approve);
router.patch('/:id/refuse', requirePermission('TimeOff', 'approve'), validate(reviewRequestSchema), requestController.refuse);

export default router;
