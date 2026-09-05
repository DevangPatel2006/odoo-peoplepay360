import Joi from 'joi';
import {
  TIME_OFF_UNITS,
  TIME_OFF_APPROVAL_LEVELS,
  TIME_OFF_ALLOCATION_STATUSES,
  TIME_OFF_REQUEST_STATUSES,
} from '../constants/enums.js';

// Time Off Type Schemas
export const createTimeOffTypeSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  unit: Joi.string().valid(...TIME_OFF_UNITS).default(TIME_OFF_UNITS[0]),
  requires_allocation: Joi.boolean().default(true),
  approval_level: Joi.string().valid(...TIME_OFF_APPROVAL_LEVELS).default(TIME_OFF_APPROVAL_LEVELS[0]),
  affects_payroll: Joi.boolean().default(true),
  display_color: Joi.string().trim().max(20).default('#3B82F6'),
  is_active: Joi.boolean().default(true),
  configuration_notes: Joi.string().allow(null, ''),
});

export const updateTimeOffTypeSchema = Joi.object({
  name: Joi.string().trim().max(100),
  unit: Joi.string().valid(...TIME_OFF_UNITS),
  requires_allocation: Joi.boolean(),
  approval_level: Joi.string().valid(...TIME_OFF_APPROVAL_LEVELS),
  affects_payroll: Joi.boolean(),
  display_color: Joi.string().trim().max(20),
  is_active: Joi.boolean(),
  configuration_notes: Joi.string().allow(null, ''),
});

// Allocation Schemas
export const createAllocationSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  time_off_type_id: Joi.number().integer().positive().required(),
  allocated_amount: Joi.number().precision(2).min(0).required(),
  validity_start: Joi.date().iso().required(),
  validity_end: Joi.date().iso().min(Joi.ref('validity_start')).required(),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid(...TIME_OFF_ALLOCATION_STATUSES).default(TIME_OFF_ALLOCATION_STATUSES[0]),
});

export const updateAllocationSchema = Joi.object({
  allocated_amount: Joi.number().precision(2).min(0),
  validity_start: Joi.date().iso(),
  validity_end: Joi.date().iso(),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid(...TIME_OFF_ALLOCATION_STATUSES),
});

export const queryAllocationSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(100),
  employee_id: Joi.number().integer().positive(),
  time_off_type_id: Joi.number().integer().positive(),
  status: Joi.string().valid(...TIME_OFF_ALLOCATION_STATUSES),
});

// Request Schemas
export const createRequestSchema = Joi.object({
  employee_id: Joi.number().integer().positive().allow(null),
  time_off_type_id: Joi.number().integer().positive().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  duration: Joi.number().precision(2).positive().required(),
  allocation_id: Joi.number().integer().positive().allow(null),
  reason: Joi.string().allow(null, ''),
});

export const updateRequestSchema = Joi.object({
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso(),
  duration: Joi.number().precision(2).positive(),
  allocation_id: Joi.number().integer().positive().allow(null),
  reason: Joi.string().allow(null, ''),
  status: Joi.string().valid(...TIME_OFF_REQUEST_STATUSES),
});

export const reviewRequestSchema = Joi.object({
  reason: Joi.string().allow(null, ''),
  allocation_id: Joi.number().integer().positive().allow(null),
});

export const queryRequestSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(100),
  employee_id: Joi.number().integer().positive(),
  time_off_type_id: Joi.number().integer().positive(),
  status: Joi.string().valid(...TIME_OFF_REQUEST_STATUSES),
});

export default {
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
  createAllocationSchema,
  updateAllocationSchema,
  queryAllocationSchema,
  createRequestSchema,
  updateRequestSchema,
  reviewRequestSchema,
  queryRequestSchema,
};
