import { Router } from 'express';
import dashboardController from './dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// Restrict executive dashboard intelligence to management and payroll personnel only
router.use((req, res, next) => {
  const roles = req.user?.roles || [];
  const isEmployeeOnly = roles.length > 0 && roles.every((r) => r === 'Employee');
  if (isEmployeeOnly) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied: Executive workforce and payroll dashboard is restricted to management personnel.',
      },
    });
  }
  return next();
});

router.get('/', requirePermission('Employees', 'read'), dashboardController.getDashboardSummary);
router.get('/kpis', requirePermission('Employees', 'read'), dashboardController.getKpis);
router.get('/salary-cost-by-department', requirePermission('Payslips', 'read'), dashboardController.getSalaryCostByDepartment);
router.get('/monthly-trend', requirePermission('Payslips', 'read'), dashboardController.getMonthlyTrend);
router.get('/attendance-overview', requirePermission('Attendance', 'read'), dashboardController.getAttendanceOverview);
router.get('/time-off-overview', requirePermission('TimeOff', 'read'), dashboardController.getTimeOffOverview);
router.get('/department-overview', requirePermission('Employees', 'read'), dashboardController.getDepartmentOverview);
router.get('/alerts', requirePermission('Payruns', 'read'), dashboardController.getAlerts);

export default router;
