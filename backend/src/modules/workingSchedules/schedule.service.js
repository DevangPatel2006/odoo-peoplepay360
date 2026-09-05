import scheduleModel from './schedule.model.js';
import { withTransaction } from '../../config/db.js';
import env from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listSchedules = async (user, queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const { rows, total } = await scheduleModel.findAll({
    company_id: user.companyId,
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

export const getScheduleById = async (id, user) => {
  const schedule = await scheduleModel.findById(parseInt(id, 10), user.companyId);
  if (!schedule) {
    throw new AppError('Working schedule not found', 404, 'NOT_FOUND');
  }
  return schedule;
};

export const createSchedule = async (user, data) => {
  return withTransaction(async (client) => {
    const created = await scheduleModel.create(client, user.companyId, data);
    return scheduleModel.findById(created.id, user.companyId);
  });
};

export const updateSchedule = async (id, user, data) => {
  await getScheduleById(id, user);
  await withTransaction(async (client) => {
    await scheduleModel.update(client, parseInt(id, 10), user.companyId, data);
  });
  return scheduleModel.findById(parseInt(id, 10), user.companyId);
};

export const deleteSchedule = async (id, user) => {
  await getScheduleById(id, user);
  await scheduleModel.remove(parseInt(id, 10), user.companyId);
  return true;
};

export default {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
