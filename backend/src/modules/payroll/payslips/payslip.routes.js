import { Router } from 'express';
import payslipController from './payslip.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import { queryPayslipSchema } from '../../../common/validators/payslip.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Payslips', 'read'), validate(queryPayslipSchema, 'query'), payslipController.list);
router.get('/:id', requirePermission('Payslips', 'read'), payslipController.getById);
router.get('/:id/pdf', requirePermission('Payslips', 'read'), payslipController.getPdf);

export default router;
