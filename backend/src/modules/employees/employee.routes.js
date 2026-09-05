import { Router } from 'express';
import employeeController from './employee.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  queryEmployeeSchema,
} from '../../common/validators/employee.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('Employees', 'read'), validate(queryEmployeeSchema, 'query'), employeeController.list);
router.get('/:id', requirePermission('Employees', 'read'), employeeController.getById);
router.post('/', requirePermission('Employees', 'create'), validate(createEmployeeSchema), employeeController.create);
router.patch('/:id', requirePermission('Employees', 'update'), validate(updateEmployeeSchema), employeeController.update);
router.delete('/:id', requirePermission('Employees', 'delete'), employeeController.remove);
router.post('/:id/reset-credentials', requirePermission('Employees', 'update'), employeeController.resetCredentials);

// Smart buttons
router.get('/:id/contracts', requirePermission('Contracts', 'read'), employeeController.getEmployeeContracts);
router.get('/:id/attendance', requirePermission('Attendance', 'read'), employeeController.getEmployeeAttendance);
router.get('/:id/time-off', requirePermission('TimeOff', 'read'), employeeController.getEmployeeTimeOff);
router.get('/:id/allocations', requirePermission('TimeOff', 'read'), employeeController.getEmployeeAllocations);

export default router;
