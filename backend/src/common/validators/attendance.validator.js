import Joi from 'joi';
import { ATTENDANCE_STATUSES } from '../constants/enums.js';

export const checkInSchema = Joi.object({
  employee_id: Joi.number().integer().positive().allow(null),
  // Prevent future-dated check-ins — spec implies real day-to-day tracking
  attendance_date: Joi.date().iso().max('now'),
  notes: Joi.string().allow(null, ''),
});

export const checkOutSchema = Joi.object({
  employee_id: Joi.number().integer().positive().allow(null),
  notes: Joi.string().allow(null, ''),
});

export const createAttendanceSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  // Prevent future-dated manual entries — must use correction flow for backdating
  attendance_date: Joi.date().iso().max('now').required(),
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
  // is_manual_correction intentionally excluded — always force-set server-side
  // in attendance.service.js updateAttendance(). Client input must not override.
});

export const queryAttendanceSchema = Joi.object({
  page: Joi.number().integer().min(1),
  // Defense-in-depth: cap at 100 (service also caps via env.pagination.maxPageSize)
  pageSize: Joi.number().integer().min(1).max(100),
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
