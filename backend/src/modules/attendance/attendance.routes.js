import { Router } from 'express';
import attendanceController from './attendance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import validate from '../../common/validators/validate.middleware.js';
import {
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  queryAttendanceSchema,
} from '../../common/validators/attendance.validator.js';

const router = Router();

router.use(authenticate);

// Quick check-in and check-out convenience routes
router.post('/check-in', requirePermission('Attendance', 'create'), validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', requirePermission('Attendance', 'create'), validate(checkOutSchema), attendanceController.checkOut);

router.get('/', requirePermission('Attendance', 'read'), validate(queryAttendanceSchema, 'query'), attendanceController.list);
router.get('/:id', requirePermission('Attendance', 'read'), attendanceController.getById);
router.post('/', requirePermission('Attendance', 'create'), validate(createAttendanceSchema), attendanceController.create);
router.patch('/:id', requirePermission('Attendance', 'update'), validate(updateAttendanceSchema), attendanceController.update);
router.delete('/:id', requirePermission('Attendance', 'delete'), attendanceController.remove);

export default router;
