import attendanceModel from './attendance.model.js';
import employeeModel from '../employees/employee.model.js';
import env from '../../config/env.js';
import { resolveOwnershipScope } from '../../common/utils/scope.js';
import { formatDate } from '../../common/utils/dateUtils.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listAttendances = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Attendance');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const filterEmployeeId = scope === 'own' ? employeeId : (queryParams.employee_id ? parseInt(queryParams.employee_id, 10) : undefined);

  const { rows, total } = await attendanceModel.findAll({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    start_date: queryParams.start_date,
    end_date: queryParams.end_date,
    status: queryParams.status,
    limit: pageSize,
    offset,
  });

  return {
    data: rows,
    meta: {
      page,
      pageSize,
      total,
    },
  };
};

export const getAttendanceById = async (id, user) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'Attendance');
  const attendance = await attendanceModel.findById(parseInt(id, 10), user.companyId);

  if (!attendance) {
    throw new AppError('Attendance record not found', 404, 'NOT_FOUND');
  }

  if (scope === 'own' && attendance.employee_id !== employeeId) {
    throw new AppError('Access denied: You may only view your own attendance records', 403, 'FORBIDDEN');
  }

  return attendance;
};

export const checkIn = async (user, data = {}) => {
  const { scope, employeeId: selfEmployeeId } = resolveOwnershipScope(user, 'Attendance');
  const targetEmployeeId = scope === 'own' ? selfEmployeeId : (data.employee_id ? parseInt(data.employee_id, 10) : selfEmployeeId);

  if (!targetEmployeeId) {
    throw new AppError('Employee ID is required for check-in', 400, 'VALIDATION_ERROR');
  }

  const employee = await employeeModel.findById(targetEmployeeId, user.companyId);
  if (!employee) {
    throw new AppError('Employee not found in your company', 404, 'NOT_FOUND');
  }

  const today = data.attendance_date ? formatDate(data.attendance_date) : formatDate(new Date());

  const existing = await attendanceModel.findByEmployeeAndDate(targetEmployeeId, today);
  if (existing) {
    throw new AppError(`Attendance for ${today} is already recorded`, 409, 'CONFLICT');
  }

  const now = new Date().toISOString();

  const created = await attendanceModel.create({
    employee_id: targetEmployeeId,
    attendance_date: today,
    check_in_at: now,
    status: 'Present',
    notes: data.notes || null,
  });

  // Re-fetch with full joins (employee name, department, corrected_by_email)
  // so the API response shape is consistent with GET /attendance/:id
  return attendanceModel.findById(created.id, user.companyId);
};

export const checkOut = async (user, data = {}) => {
  const { scope, employeeId: selfEmployeeId } = resolveOwnershipScope(user, 'Attendance');
  const targetEmployeeId = scope === 'own' ? selfEmployeeId : (data.employee_id ? parseInt(data.employee_id, 10) : selfEmployeeId);

  if (!targetEmployeeId) {
    throw new AppError('Employee ID is required for check-out', 400, 'VALIDATION_ERROR');
  }

  const today = formatDate(new Date());
  const existing = await attendanceModel.findByEmployeeAndDate(targetEmployeeId, today);

  if (!existing) {
    throw new AppError('No active check-in found for today. Please check in first.', 404, 'NOT_FOUND');
  }

  if (existing.check_out_at) {
    throw new AppError('Already checked out for today', 400, 'ALREADY_CHECKED_OUT');
  }

  const now = new Date().toISOString();

  await attendanceModel.update(existing.id, {
    check_out_at: now,
    notes: data.notes ? (existing.notes ? `${existing.notes} | ${data.notes}` : data.notes) : existing.notes,
  });

  // Re-fetch with full joins so worked_hours (generated column) and
  // employee/department fields are included in the response
  return attendanceModel.findById(existing.id, user.companyId);
};

export const createAttendance = async (user, data) => {
  const employee = await employeeModel.findById(data.employee_id, user.companyId);
  if (!employee) {
    throw new AppError('Employee not found in your company', 404, 'NOT_FOUND');
  }

  return attendanceModel.create(data);
};

export const updateAttendance = async (id, user, data) => {
  await getAttendanceById(id, user);

  // Manual correction tracking
  const updatePayload = {
    ...data,
    is_manual_correction: true,
    corrected_by_user_id: user.id,
  };

  return attendanceModel.update(parseInt(id, 10), updatePayload);
};

export const deleteAttendance = async (id, user) => {
  await getAttendanceById(id, user);
  await attendanceModel.remove(parseInt(id, 10));
  return true;
};

export default {
  listAttendances,
  getAttendanceById,
  checkIn,
  checkOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};
