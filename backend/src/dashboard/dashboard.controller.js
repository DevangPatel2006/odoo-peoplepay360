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

export default {
  getKpis,
  getSalaryCostByDepartment,
  getMonthlyTrend,
  getAttendanceOverview,
  getTimeOffOverview,
  getDepartmentOverview,
  getAlerts,
};
