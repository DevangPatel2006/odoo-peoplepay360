import { Router } from 'express';
import structureController from './structure.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  querySalaryStructureSchema,
} from '../../../common/validators/salaryStructure.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('SalaryStructures', 'read'), validate(querySalaryStructureSchema, 'query'), structureController.list);
router.get('/:id', requirePermission('SalaryStructures', 'read'), structureController.getById);
router.post('/', requirePermission('SalaryStructures', 'create'), validate(createSalaryStructureSchema), structureController.create);
router.patch('/:id', requirePermission('SalaryStructures', 'update'), validate(updateSalaryStructureSchema), structureController.update);
router.delete('/:id', requirePermission('SalaryStructures', 'delete'), structureController.remove);

export default router;
