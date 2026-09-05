import { Router } from 'express';
import dashboardController from './dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', dashboardController.getDashboardSummary);
router.get('/kpis', requirePermission('Employees', 'read'), dashboardController.getKpis);
router.get('/salary-cost-by-department', requirePermission('Payslips', 'read'), dashboardController.getSalaryCostByDepartment);
router.get('/monthly-trend', requirePermission('Payslips', 'read'), dashboardController.getMonthlyTrend);
router.get('/attendance-overview', requirePermission('Attendance', 'read'), dashboardController.getAttendanceOverview);
router.get('/time-off-overview', requirePermission('TimeOff', 'read'), dashboardController.getTimeOffOverview);
router.get('/department-overview', requirePermission('Employees', 'read'), dashboardController.getDepartmentOverview);
router.get('/alerts', requirePermission('Payruns', 'read'), dashboardController.getAlerts);

export default router;
