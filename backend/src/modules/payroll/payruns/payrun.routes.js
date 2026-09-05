import { Router } from 'express';
import payrunController from './payrun.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  previewPayrunSchema,
  createPayrunSchema,
  validatePayrunActionSchema,
  queryPayrunSchema,
} from '../../../common/validators/payrun.validator.js';

const router = Router();

router.use(authenticate);

// Wizard Step 1: Preview Eligible Employees
router.post('/preview-eligible-employees', requirePermission('Payruns', 'read'), validate(previewPayrunSchema), payrunController.preview);

// Wizard Step 2: Create Payrun
router.post('/', requirePermission('Payruns', 'create'), validate(createPayrunSchema), payrunController.create);

// Standard Payrun query routes
router.get('/', requirePermission('Payruns', 'read'), validate(queryPayrunSchema, 'query'), payrunController.list);
router.get('/:id', requirePermission('Payruns', 'read'), payrunController.getById);
router.get('/:id/warnings', requirePermission('Payruns', 'read'), payrunController.getWarnings);

// Processing Actions
router.post('/:id/compute', requirePermission('Payruns', 'update'), payrunController.compute);
router.post('/:id/validate', requirePermission('Payruns', 'update'), validate(validatePayrunActionSchema), payrunController.validateAction);
router.post('/:id/mark-paid', requirePermission('Payruns', 'update'), payrunController.markPaid);
router.patch('/:id/archive', requirePermission('Payruns', 'update'), payrunController.archive);
router.post('/:id/unarchive', requirePermission('Payruns', 'update'), payrunController.unarchive);
router.patch('/:id/unarchive', requirePermission('Payruns', 'update'), payrunController.unarchive);
router.post('/:id/send-payslips', requirePermission('Payruns', 'update'), payrunController.sendPayslips);

export default router;
