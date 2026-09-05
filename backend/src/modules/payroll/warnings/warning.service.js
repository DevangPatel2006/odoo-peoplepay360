import payrollModel from '../payroll.model.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const resolveWarning = async (warningId) => {
  const warning = await payrollModel.resolveWarning(parseInt(warningId, 10));
  if (!warning) {
    throw new AppError('Payroll warning not found', 404, 'NOT_FOUND');
  }
  return warning;
};

export default {
  resolveWarning,
};
