import { Router } from 'express';
import jobPositionController from './jobPosition.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  createJobPositionSchema,
  updateJobPositionSchema,
} from '../../common/validators/jobPosition.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Employees', 'read'), jobPositionController.list);
router.get('/:id', requirePermission('Employees', 'read'), jobPositionController.getById);
router.post('/', requirePermission('Employees', 'create'), validate(createJobPositionSchema), jobPositionController.create);
router.patch('/:id', requirePermission('Employees', 'update'), validate(updateJobPositionSchema), jobPositionController.update);
router.delete('/:id', requirePermission('Employees', 'delete'), jobPositionController.remove);

export default router;
