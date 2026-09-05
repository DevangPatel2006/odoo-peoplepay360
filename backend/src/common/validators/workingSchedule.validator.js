import Joi from 'joi';
import { SCHEDULE_STATUSES, SCHEDULE_DAYS } from '../constants/enums.js';

const scheduleLineSchema = Joi.object({
  day_of_week: Joi.string().valid(...SCHEDULE_DAYS).required(),
  start_time: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
  end_time: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required(),
  break_minutes: Joi.number().integer().min(0).default(0),
});

export const createWorkingScheduleSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  calendar_type: Joi.string().trim().max(50).default('Standard'),
  timezone: Joi.string().trim().max(100).default('UTC'),
  status: Joi.string().valid(...SCHEDULE_STATUSES).default(SCHEDULE_STATUSES[0]),
  lines: Joi.array().items(scheduleLineSchema).default([]),
});

export const updateWorkingScheduleSchema = Joi.object({
  name: Joi.string().trim().max(255),
  calendar_type: Joi.string().trim().max(50),
  timezone: Joi.string().trim().max(100),
  status: Joi.string().valid(...SCHEDULE_STATUSES),
  lines: Joi.array().items(scheduleLineSchema),
});

export const queryWorkingScheduleSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  status: Joi.string().valid(...SCHEDULE_STATUSES),
  search: Joi.string().trim().allow(''),
});

export default {
  createWorkingScheduleSchema,
  updateWorkingScheduleSchema,
  queryWorkingScheduleSchema,
};
