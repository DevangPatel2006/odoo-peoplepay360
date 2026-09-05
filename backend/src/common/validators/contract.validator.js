import Joi from 'joi';
import { CONTRACT_STATUSES } from '../constants/enums.js';

export const createContractSchema = Joi.object({
  contract_number: Joi.string().trim().max(100).allow(null, '').optional(),
  employee_id: Joi.number().integer().positive().required(),
  department_id: Joi.number().integer().positive().allow(null),
  job_position_id: Joi.number().integer().positive().allow(null),
  working_schedule_id: Joi.number().integer().positive().allow(null),
  salary_structure_id: Joi.number().integer().positive().allow(null),
  wage_per_month: Joi.number().precision(2).min(0).required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null),
  status: Joi.string().valid(...CONTRACT_STATUSES).default(CONTRACT_STATUSES[0]),
  notes: Joi.string().allow(null, ''),
});

export const updateContractSchema = Joi.object({
  contract_number: Joi.string().trim().max(100),
  employee_id: Joi.number().integer().positive(),
  department_id: Joi.number().integer().positive().allow(null),
  job_position_id: Joi.number().integer().positive().allow(null),
  working_schedule_id: Joi.number().integer().positive().allow(null),
  salary_structure_id: Joi.number().integer().positive().allow(null),
  wage_per_month: Joi.number().precision(2).min(0),
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().allow(null),
  status: Joi.string().valid(...CONTRACT_STATUSES),
  notes: Joi.string().allow(null, ''),
});

export const queryContractSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  employee_id: Joi.number().integer().positive(),
  department_id: Joi.number().integer().positive(),
  status: Joi.string().valid(...CONTRACT_STATUSES),
});

export const applicableContractQuerySchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  period_start: Joi.date().iso().required(),
  period_end: Joi.date().iso().required(),
});

export default {
  createContractSchema,
  updateContractSchema,
  queryContractSchema,
  applicableContractQuerySchema,
};
