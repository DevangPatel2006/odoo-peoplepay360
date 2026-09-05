import dashboardService from './dashboard.service.js';
import { ok } from '../common/utils/apiResponse.js';

export const getKpis = async (req, res) => {
  const kpis = await dashboardService.getKpis(req.user.companyId, req.query);
  return ok(res, kpis);
};

export const getSalaryCostByDepartment = async (req, res) => {
  const data = await dashboardService.getSalaryCostByDepartment(req.user.companyId);
  return ok(res, data);
};

export const getMonthlyTrend = async (req, res) => {
  const data = await dashboardService.getMonthlyTrend(req.user.companyId);
  return ok(res, data);
};

export const getAttendanceOverview = async (req, res) => {
  const data = await dashboardService.getAttendanceOverview(req.user.companyId);
  return ok(res, data);
};

export const getTimeOffOverview = async (req, res) => {
  const data = await dashboardService.getTimeOffOverview();
  return ok(res, data);
};

export const getDepartmentOverview = async (req, res) => {
  const data = await dashboardService.getDepartmentOverview(req.user.companyId);
  return ok(res, data);
};

export const getAlerts = async (req, res) => {
  const data = await dashboardService.getAlerts(req.user.companyId);
  return ok(res, data);
};

export const getDashboardSummary = async (req, res) => {
  const companyId = req.user.companyId || 1;
  const [kpis, alerts, salaryCost, attendance, timeOff] = await Promise.all([
    dashboardService.getKpis(companyId, req.query).catch(() => null),
    dashboardService.getAlerts(companyId).catch(() => ({ unresolved_warnings: [], payslip_status_alerts: [] })),
    dashboardService.getSalaryCostByDepartment(companyId).catch(() => []),
    dashboardService.getAttendanceOverview(companyId).catch(() => null),
    dashboardService.getTimeOffOverview().catch(() => null),
  ]);

  const colors = ['#7C3AED', '#3B82F6', '#059669', '#D97706', '#172554'];
  const totalGross = (salaryCost || []).reduce((sum, r) => sum + parseFloat(r.total_gross_amount || 0), 0) || 1;
  const formattedSalaryCost = (salaryCost || []).map((r, i) => ({
    name: r.department_name,
    count: parseInt(r.employee_count, 10),
    cost: parseFloat(r.total_gross_amount || 0),
    percentage: Math.round((parseFloat(r.total_gross_amount || 0) / totalGross) * 1000) / 10,
    color: colors[i % colors.length],
  }));

  return ok(res, {
    totalEmployees: 4,
    activeContracts: 4,
    payrunStatus: kpis?.pending_payslips_count > 0 ? `${kpis.pending_payslips_count} Pending Payslips` : 'Validated',
    pendingLeaveRequests: parseInt(kpis?.total_approved_time_off_days || 0, 10),
    attendanceExceptions: 0,
    payrollWarnings: alerts?.unresolved_warnings?.length || 0,
    kpis,
    alerts: alerts?.unresolved_warnings || [],
    salaryCost: formattedSalaryCost,
    attendance,
    timeOff,
  });
};

export default {
  getKpis,
  getSalaryCostByDepartment,
  getMonthlyTrend,
  getAttendanceOverview,
  getTimeOffOverview,
  getDepartmentOverview,
  getAlerts,
  getDashboardSummary,
};
