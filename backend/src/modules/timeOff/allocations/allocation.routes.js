import { Router } from 'express';
import allocationController from './allocation.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  createAllocationSchema,
  updateAllocationSchema,
  queryAllocationSchema,
} from '../../../common/validators/timeOff.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('TimeOff', 'read'), validate(queryAllocationSchema, 'query'), allocationController.list);
router.get('/:id', requirePermission('TimeOff', 'read'), allocationController.getById);
router.post('/', requirePermission('TimeOff', 'create'), validate(createAllocationSchema), allocationController.create);
router.patch('/:id', requirePermission('TimeOff', 'update'), validate(updateAllocationSchema), allocationController.update);
router.put('/:id', requirePermission('TimeOff', 'update'), validate(updateAllocationSchema), allocationController.update);
router.delete('/:id', requirePermission('TimeOff', 'delete'), allocationController.remove);

router.patch('/:id/approve', requirePermission('TimeOff', 'approve'), allocationController.approve);
router.patch('/:id/refuse', requirePermission('TimeOff', 'approve'), allocationController.refuse);

export default router;
