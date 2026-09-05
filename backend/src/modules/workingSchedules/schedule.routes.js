import { Router } from 'express';
import scheduleController from './schedule.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  createWorkingScheduleSchema,
  updateWorkingScheduleSchema,
  queryWorkingScheduleSchema,
} from '../../common/validators/workingSchedule.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Employees', 'read'), validate(queryWorkingScheduleSchema, 'query'), scheduleController.list);
router.get('/:id', requirePermission('Employees', 'read'), scheduleController.getById);
router.post('/', requirePermission('Employees', 'create'), validate(createWorkingScheduleSchema), scheduleController.create);
router.patch('/:id', requirePermission('Employees', 'update'), validate(updateWorkingScheduleSchema), scheduleController.update);
router.delete('/:id', requirePermission('Employees', 'delete'), scheduleController.remove);

export default router;
