import scheduleService from './schedule.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await scheduleService.listSchedules(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const schedule = await scheduleService.getScheduleById(req.params.id, req.user);
  return ok(res, schedule);
};

export const create = async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.user, req.body);
  return ok(res, schedule, undefined, 201);
};

export const update = async (req, res) => {
  const schedule = await scheduleService.updateSchedule(req.params.id, req.user, req.body);
  return ok(res, schedule);
};

export const remove = async (req, res) => {
  await scheduleService.deleteSchedule(req.params.id, req.user);
  return ok(res, { message: 'Working schedule deleted successfully' });
};

export default {
  list,
  getById,
  create,
  update,
  remove,
};
