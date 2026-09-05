import { Router } from 'express';
import ruleController from './rule.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import validate from '../../../common/validators/validate.middleware.js';
import {
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  querySalaryRuleSchema,
} from '../../../common/validators/salaryRule.validator.js';

const router = Router();

router.use(authenticate);

router.get('/structure/:structureId', requirePermission('SalaryRules', 'read'), validate(querySalaryRuleSchema, 'query'), ruleController.listByStructure);
router.get('/:id', requirePermission('SalaryRules', 'read'), ruleController.getById);
router.post('/structure/:structureId', requirePermission('SalaryRules', 'create'), validate(createSalaryRuleSchema), ruleController.create);
router.post('/', requirePermission('SalaryRules', 'create'), validate(createSalaryRuleSchema), ruleController.create);
router.patch('/:id', requirePermission('SalaryRules', 'update'), validate(updateSalaryRuleSchema), ruleController.update);
router.delete('/:id', requirePermission('SalaryRules', 'delete'), ruleController.remove);

export default router;
