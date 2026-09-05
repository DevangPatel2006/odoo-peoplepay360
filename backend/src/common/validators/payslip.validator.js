import Joi from 'joi';
import { PAYSLIP_STATUSES } from '../constants/enums.js';

export const queryPayslipSchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1),
  payrun_id: Joi.number().integer().positive(),
  employee_id: Joi.number().integer().positive(),
  status: Joi.string().valid(...PAYSLIP_STATUSES),
});

export default {
  queryPayslipSchema,
};
