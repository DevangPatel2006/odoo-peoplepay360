import { Router } from 'express';
import departmentController from './department.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from '../../common/validators/department.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Employees', 'read'), departmentController.list);
router.get('/:id', requirePermission('Employees', 'read'), departmentController.getById);
router.post('/', requirePermission('Employees', 'create'), validate(createDepartmentSchema), departmentController.create);
router.patch('/:id', requirePermission('Employees', 'update'), validate(updateDepartmentSchema), departmentController.update);
router.delete('/:id', requirePermission('Employees', 'delete'), departmentController.remove);

export default router;
