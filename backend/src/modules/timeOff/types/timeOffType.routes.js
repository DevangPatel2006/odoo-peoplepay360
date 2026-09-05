import { Router } from 'express';
import timeOffTypeController from './timeOffType.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
} from '../../../common/validators/timeOff.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('TimeOff', 'read'), timeOffTypeController.list);
router.get('/:id', requirePermission('TimeOff', 'read'), timeOffTypeController.getById);
router.post('/', requirePermission('TimeOff', 'create'), validate(createTimeOffTypeSchema), timeOffTypeController.create);
router.patch('/:id', requirePermission('TimeOff', 'update'), validate(updateTimeOffTypeSchema), timeOffTypeController.update);
router.put('/:id', requirePermission('TimeOff', 'update'), validate(updateTimeOffTypeSchema), timeOffTypeController.update);
router.delete('/:id', requirePermission('TimeOff', 'delete'), timeOffTypeController.remove);

export default router;
