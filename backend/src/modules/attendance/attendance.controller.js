import attendanceService from './attendance.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await attendanceService.listAttendances(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const attendance = await attendanceService.getAttendanceById(req.params.id, req.user);
  return ok(res, attendance);
};

export const checkIn = async (req, res) => {
  const attendance = await attendanceService.checkIn(req.user, req.body);
  return ok(res, attendance, undefined, 201);
};

export const checkOut = async (req, res) => {
  const attendance = await attendanceService.checkOut(req.user, req.body);
  return ok(res, attendance);
};

export const create = async (req, res) => {
  const attendance = await attendanceService.createAttendance(req.user, req.body);
  return ok(res, attendance, undefined, 201);
};

export const update = async (req, res) => {
  const attendance = await attendanceService.updateAttendance(req.params.id, req.user, req.body);
  return ok(res, attendance);
};

export const remove = async (req, res) => {
  await attendanceService.deleteAttendance(req.params.id, req.user);
  return ok(res, { message: 'Attendance record deleted successfully' });
};

export default {
  list,
  getById,
  checkIn,
  checkOut,
  create,
  update,
  remove,
};
