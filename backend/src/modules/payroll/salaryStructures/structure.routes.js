import { Router } from 'express';
import structureController from './structure.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  querySalaryStructureSchema,
} from '../../../common/validators/salaryStructure.validator.js';

const router = Router();

router.use(authenticate);

// Permitted for roles with SalaryStructures read OR roles that create/update contracts (e.g. HR Manager)
const canReadStructures = requireAnyPermission([
  { module: 'SalaryStructures', action: 'read' },
  { module: 'Contracts', action: 'create' },
  { module: 'Contracts', action: 'update' },
]);

router.get('/', canReadStructures, validate(querySalaryStructureSchema, 'query'), structureController.list);
router.get('/:id', canReadStructures, structureController.getById);
router.post('/', requirePermission('SalaryStructures', 'create'), validate(createSalaryStructureSchema), structureController.create);
router.patch('/:id', requirePermission('SalaryStructures', 'update'), validate(updateSalaryStructureSchema), structureController.update);
router.delete('/:id', requirePermission('SalaryStructures', 'delete'), structureController.remove);

export default router;
