import Joi from 'joi';

export const createUserSchema = Joi.object({
  work_email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  employee_id: Joi.number().integer().positive().allow(null),
  is_active: Joi.boolean().default(true),
  role_ids: Joi.array().items(Joi.number().integer().positive()).default([]),
});

export const updateUserSchema = Joi.object({
  work_email: Joi.string().email(),
  password: Joi.string().min(6),
  employee_id: Joi.number().integer().positive().allow(null),
  is_active: Joi.boolean(),
  role_ids: Joi.array().items(Joi.number().integer().positive()),
  job_position_id: Joi.number().integer().positive().allow(null),
});

export const assignRoleSchema = Joi.object({
  role_id: Joi.number().integer().positive().required(),
});

export default {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
};
