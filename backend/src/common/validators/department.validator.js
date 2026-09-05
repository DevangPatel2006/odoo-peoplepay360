import Joi from 'joi';

export const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  parent_department_id: Joi.number().integer().positive().allow(null),
  manager_employee_id: Joi.number().integer().positive().allow(null),
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().max(255),
  parent_department_id: Joi.number().integer().positive().allow(null),
  manager_employee_id: Joi.number().integer().positive().allow(null),
});

export default {
  createDepartmentSchema,
  updateDepartmentSchema,
};
