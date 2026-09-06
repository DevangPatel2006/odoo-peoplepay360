import { Router } from 'express';
import payslipController from './payslip.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import { queryPayslipSchema } from '../../../common/validators/payslip.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Payslips', 'read'), validate(queryPayslipSchema, 'query'), payslipController.list);

/**
 * GET /:id - Retrieve single payslip master record with computed lines
 * 
 * Worked-Days Semantics (v1 Specification):
 * The returned `worked_days` field reflects recorded attendance occurrences for
 * display, reporting, and audit purposes (visible on the Payslip view per section B7).
 * In this v1 release, salary computation evaluates full contract wage_per_month without
 * attendance proration.
 */
router.get('/:id', requirePermission('Payslips', 'read'), payslipController.getById);
router.get('/:id/pdf', requirePermission('Payslips', 'read'), payslipController.getPdf);
router.post('/:id/send-email', requirePermission('Payslips', 'read'), payslipController.sendEmail);

export default router;
