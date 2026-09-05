import Joi from 'joi';
import { EMPLOYEE_TYPES, EMPLOYEE_STATUSES } from '../constants/enums.js';

export const createEmployeeSchema = Joi.object({
  employee_code: Joi.string().trim().max(50).required(),
  first_name: Joi.string().trim().max(100).required(),
  last_name: Joi.string().trim().max(100).required(),
  work_email: Joi.string().email().max(255).required(),
  personal_phone: Joi.string().trim().max(50).allow(null, ''),
  department_id: Joi.number().integer().positive().allow(null),
  job_position_id: Joi.number().integer().positive().allow(null),
  manager_id: Joi.number().integer().positive().allow(null),
  working_schedule_id: Joi.number().integer().positive().allow(null),
  work_location: Joi.string().trim().max(255).allow(null, ''),
  employee_type: Joi.string().valid(...EMPLOYEE_TYPES).required(),
  status: Joi.string().valid(...EMPLOYEE_STATUSES).default(EMPLOYEE_STATUSES[0]),
  date_of_joining: Joi.date().iso().required(),
  date_of_birth: Joi.date().iso().allow(null),
  gender: Joi.string().trim().max(20).allow(null, ''),
  address: Joi.string().trim().allow(null, ''),
  bank_account_number: Joi.string().trim().max(100).allow(null, ''),
  bank_ifsc_or_swift: Joi.string().trim().max(50).allow(null, ''),
  bank_name: Joi.string().trim().max(150).allow(null, ''),
  photo_url: Joi.string().uri().allow(null, ''),
});

export const updateEmployeeSchema = Joi.object({
  employee_code: Joi.string().trim().max(50),
  first_name: Joi.string().trim().max(100),
  last_name: Joi.string().trim().max(100),
  work_email: Joi.string().email().max(255),
  personal_phone: Joi.string().trim().max(50).allow(null, ''),
  department_id: Joi.number().integer().positive().allow(null),
  job_position_id: Joi.number().integer().positive().allow(null),
  manager_id: Joi.number().integer().positive().allow(null),
  working_schedule_id: Joi.number().integer().positive().allow(null),
  work_location: Joi.string().trim().max(255).allow(null, ''),
  employee_type: Joi.string().valid(...EMPLOYEE_TYPES),
  status: Joi.string().valid(...EMPLOYEE_STATUSES),
  date_of_joining: Joi.date().iso(),
  date_of_birth: Joi.date().iso().allow(null),
  gender: Joi.string().trim().max(20).allow(null, ''),
  address: Joi.string().trim().allow(null, ''),
  bank_account_number: Joi.string().trim().max(100).allow(null, ''),
  bank_ifsc_or_swift: Joi.string().trim().max(50).allow(null, ''),
  bank_name: Joi.string().trim().max(150).allow(null, ''),
  photo_url: Joi.string().uri().allow(null, ''),
});

export const queryEmployeeSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  status: Joi.string().valid(...EMPLOYEE_STATUSES),
  department_id: Joi.number().integer().positive(),
  employee_type: Joi.string().valid(...EMPLOYEE_TYPES),
  manager_id: Joi.number().integer().positive(),
  group_by: Joi.string().valid('status'),
  search: Joi.string().trim().allow(''),
});

export default {
  createEmployeeSchema,
  updateEmployeeSchema,
  queryEmployeeSchema,
};
