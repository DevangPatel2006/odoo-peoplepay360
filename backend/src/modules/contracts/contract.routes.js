import { Router } from 'express';
import contractController from './contract.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  createContractSchema,
  updateContractSchema,
  queryContractSchema,
  applicableContractQuerySchema,
} from '../../common/validators/contract.validator.js';

const router = Router();

router.use(authenticate);

router.get('/applicable', requirePermission('Contracts', 'read'), validate(applicableContractQuerySchema, 'query'), contractController.getApplicable);
router.get('/', requirePermission('Contracts', 'read'), validate(queryContractSchema, 'query'), contractController.list);
router.get('/:id', requirePermission('Contracts', 'read'), contractController.getById);
router.post('/', requirePermission('Contracts', 'create'), validate(createContractSchema), contractController.create);
router.patch('/:id', requirePermission('Contracts', 'update'), validate(updateContractSchema), contractController.update);
router.delete('/:id', requirePermission('Contracts', 'delete'), contractController.remove);
router.post('/:id/activate', requirePermission('Contracts', 'update'), contractController.activate);

export default router;
