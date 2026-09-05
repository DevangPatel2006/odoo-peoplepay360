import Joi from 'joi';

export const createJobPositionSchema = Joi.object({
  department_id: Joi.number().integer().positive().required(),
  title: Joi.string().trim().max(255).required(),
});

export const updateJobPositionSchema = Joi.object({
  department_id: Joi.number().integer().positive(),
  title: Joi.string().trim().max(255),
});

export default {
  createJobPositionSchema,
  updateJobPositionSchema,
};
