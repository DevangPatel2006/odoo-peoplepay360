import { Router } from 'express';
import { query } from '../config/db.js';
import { ok } from '../common/utils/apiResponse.js';

import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import departmentRoutes from '../modules/departments/department.routes.js';
import jobPositionRoutes from '../modules/jobPositions/jobPosition.routes.js';
import employeeRoutes from '../modules/employees/employee.routes.js';
import scheduleRoutes from '../modules/workingSchedules/schedule.routes.js';
import contractRoutes from '../modules/contracts/contract.routes.js';
import attendanceRoutes from '../modules/attendance/attendance.routes.js';
import timeOffTypeRoutes from '../modules/timeOff/types/timeOffType.routes.js';
import allocationRoutes from '../modules/timeOff/allocations/allocation.routes.js';
import requestRoutes from '../modules/timeOff/requests/request.routes.js';
import structureRoutes from '../modules/payroll/salaryStructures/structure.routes.js';
import ruleRoutes from '../modules/payroll/salaryRules/rule.routes.js';
import payrunRoutes from '../modules/payroll/payruns/payrun.routes.js';
import payslipRoutes from '../modules/payroll/payslips/payslip.routes.js';
import warningRoutes from '../modules/payroll/warnings/warning.routes.js';
import dashboardRoutes from '../dashboard/dashboard.routes.js';
import mailRoutes from '../modules/mail/mail.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  let dbHealthy = false;
  try {
    await query('SELECT 1');
    dbHealthy = true;
  } catch (err) {
    dbHealthy = false;
  }

  return ok(res, {
    status: 'ok',
    db: dbHealthy,
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/job-positions', jobPositionRoutes);
router.use('/employees', employeeRoutes);
router.use('/working-schedules', scheduleRoutes);
router.use('/contracts', contractRoutes);
router.use('/attendance', attendanceRoutes);

// Time Off Sub-modules
router.use('/time-off/types', timeOffTypeRoutes);
router.use('/time-off/allocations', allocationRoutes);
router.use('/time-off/requests', requestRoutes);

// Payroll Sub-modules
router.use('/salary-structures', structureRoutes);
router.use('/salary-rules', ruleRoutes);
router.use('/payruns', payrunRoutes);
router.use('/payroll/payruns', payrunRoutes);
router.use('/payslips', payslipRoutes);
router.use('/payroll/payslips', payslipRoutes);
router.use('/warnings', warningRoutes);
router.use('/payroll/warnings', warningRoutes);

// Dashboard & Analytics
router.use('/dashboard', dashboardRoutes);

// Executive Reports & Analytics Export
router.use('/reports', reportRoutes);

// Mail Delivery Verification
router.use('/mail', mailRoutes);

export default router;
