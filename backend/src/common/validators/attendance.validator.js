import Joi from 'joi';
import { ATTENDANCE_STATUSES } from '../constants/enums.js';

export const checkInSchema = Joi.object({
  employee_id: Joi.number().integer().positive().allow(null),
  attendance_date: Joi.date().iso(),
  notes: Joi.string().allow(null, ''),
});

export const checkOutSchema = Joi.object({
  employee_id: Joi.number().integer().positive().allow(null),
  notes: Joi.string().allow(null, ''),
});

export const createAttendanceSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  attendance_date: Joi.date().iso().required(),
  check_in_at: Joi.date().iso().allow(null),
  check_out_at: Joi.date().iso().allow(null),
  overtime_hours: Joi.number().min(0).default(0),
  status: Joi.string().valid(...ATTENDANCE_STATUSES).default(ATTENDANCE_STATUSES[0]),
  notes: Joi.string().allow(null, ''),
});

export const updateAttendanceSchema = Joi.object({
  check_in_at: Joi.date().iso().allow(null),
  check_out_at: Joi.date().iso().allow(null),
  overtime_hours: Joi.number().min(0),
  status: Joi.string().valid(...ATTENDANCE_STATUSES),
  notes: Joi.string().allow(null, ''),
  is_manual_correction: Joi.boolean().default(true),
});

export const queryAttendanceSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  employee_id: Joi.number().integer().positive(),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  status: Joi.string().valid(...ATTENDANCE_STATUSES),
});

export default {
  checkInSchema,
  checkOutSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
  queryAttendanceSchema,
};
