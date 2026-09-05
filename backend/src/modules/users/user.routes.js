import { Router } from 'express';
import userController from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
} from '../../common/validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Users', 'read'), userController.list);
router.get('/:id', requirePermission('Users', 'read'), userController.getById);
router.post('/', requirePermission('Users', 'create'), validate(createUserSchema), userController.create);
router.patch('/:id', requirePermission('Users', 'update'), validate(updateUserSchema), userController.update);
router.delete('/:id', requirePermission('Users', 'delete'), userController.remove);

router.post('/:id/roles', requirePermission('Users', 'update'), validate(assignRoleSchema), userController.addRole);
router.delete('/:id/roles/:roleId', requirePermission('Users', 'update'), userController.removeRole);

export default router;
