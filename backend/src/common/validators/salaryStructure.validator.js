import Joi from 'joi';

export const createSalaryStructureSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  structure_type: Joi.string().trim().max(50).default('Regular'),
  is_active: Joi.boolean().default(true),
});

export const updateSalaryStructureSchema = Joi.object({
  name: Joi.string().trim().max(255),
  structure_type: Joi.string().trim().max(50),
  is_active: Joi.boolean(),
});

export const querySalaryStructureSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  is_active: Joi.boolean(),
});

export default {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  querySalaryStructureSchema,
};
