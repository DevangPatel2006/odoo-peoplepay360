import Joi from 'joi';
import {
  SALARY_RULE_CATEGORIES,
  COMPUTATION_METHODS,
  PERCENTAGE_BASES,
} from '../constants/enums.js';

export const createSalaryRuleSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  code: Joi.string().trim().max(50).uppercase().required(),
  category: Joi.string().valid(...SALARY_RULE_CATEGORIES).required(),
  sequence: Joi.number().integer().min(1).default(10),
  computation_method: Joi.string().valid(...COMPUTATION_METHODS).required(),
  fixed_amount: Joi.number().precision(2).min(0).when('computation_method', {
    is: 'Fixed',
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  percentage_value: Joi.number().precision(2).min(0).max(100).when('computation_method', {
    is: 'Percentage',
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  percentage_base: Joi.string().valid(...PERCENTAGE_BASES).when('computation_method', {
    is: 'Percentage',
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  formula_expression: Joi.string().when('computation_method', {
    is: 'Formula',
    then: Joi.required(),
    otherwise: Joi.allow(null, ''),
  }),
  is_active: Joi.boolean().default(true),
});

export const updateSalaryRuleSchema = Joi.object({
  name: Joi.string().trim().max(255),
  code: Joi.string().trim().max(50).uppercase(),
  category: Joi.string().valid(...SALARY_RULE_CATEGORIES),
  sequence: Joi.number().integer().min(1),
  computation_method: Joi.string().valid(...COMPUTATION_METHODS),
  fixed_amount: Joi.number().precision(2).min(0).allow(null),
  percentage_value: Joi.number().precision(2).min(0).max(100).allow(null),
  percentage_base: Joi.string().valid(...PERCENTAGE_BASES).allow(null),
  formula_expression: Joi.string().allow(null, ''),
  is_active: Joi.boolean(),
});

export const querySalaryRuleSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  category: Joi.string().valid(...SALARY_RULE_CATEGORIES),
  is_active: Joi.boolean(),
});

export default {
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  querySalaryRuleSchema,
};
