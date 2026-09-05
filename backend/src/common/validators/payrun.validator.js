import Joi from 'joi';
import { PAYRUN_STATUSES, EMPLOYEE_TYPES } from '../constants/enums.js';

export const previewPayrunSchema = Joi.object({
  salary_structure_id: Joi.number().integer().positive().required(),
  period_start: Joi.date().iso().required(),
  period_end: Joi.date().iso().min(Joi.ref('period_start')).required(),
  employee_type_filter: Joi.string().valid(...EMPLOYEE_TYPES).allow(null, ''),
});

export const createPayrunSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  salary_structure_id: Joi.number().integer().positive().required(),
  period_start: Joi.date().iso().required(),
  period_end: Joi.date().iso().min(Joi.ref('period_start')).required(),
  employee_type_filter: Joi.string().valid(...EMPLOYEE_TYPES).allow(null, ''),
  employee_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const validatePayrunActionSchema = Joi.object({
  acknowledge_warnings: Joi.boolean().default(false),
});

export const queryPayrunSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  status: Joi.string().valid(...PAYRUN_STATUSES),
  is_archived: Joi.boolean().default(false),
  search: Joi.string().trim().allow(''),
});

export default {
  previewPayrunSchema,
  createPayrunSchema,
  validatePayrunActionSchema,
  queryPayrunSchema,
};
