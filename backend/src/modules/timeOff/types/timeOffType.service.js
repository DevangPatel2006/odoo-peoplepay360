import timeOffModel from '../timeOff.model.js';
import { query } from '../../../config/db.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const listTypes = async (queryParams = {}) => {
  const isActive =
    queryParams.is_active !== undefined
      ? queryParams.is_active === 'true'
      : undefined;
  return timeOffModel.findTypes(isActive);
};

export const getTypeById = async (id) => {
  const type = await timeOffModel.findTypeById(parseInt(id, 10));
  if (!type) {
    throw new AppError('Time off type not found', 404, 'NOT_FOUND');
  }
  return type;
};

export const createType = async (data) => {
  return timeOffModel.createType(data);
};

export const updateType = async (id, data) => {
  await getTypeById(id);
  return timeOffModel.updateType(parseInt(id, 10), data);
};

export const deleteType = async (id) => {
  await getTypeById(id);

  // Check if type is referenced in time_off_allocations or time_off_requests
  const allocCheck = await query(
    'SELECT COUNT(*) FROM time_off_allocations WHERE time_off_type_id = $1',
    [id]
  );
  const reqCheck = await query(
    'SELECT COUNT(*) FROM time_off_requests WHERE time_off_type_id = $1',
    [id]
  );

  const allocCount = parseInt(allocCheck.rows[0].count, 10);
  const reqCount = parseInt(reqCheck.rows[0].count, 10);

  if (allocCount > 0 || reqCount > 0) {
    throw new AppError(
      `Cannot hard delete time off type referenced by ${allocCount} allocations and ${reqCount} requests. Set is_active = false to deactivate instead.`,
      422,
      'TYPE_IN_USE'
    );
  }

  await timeOffModel.removeType(parseInt(id, 10));
  return true;
};

export default {
  listTypes,
  getTypeById,
  createType,
  updateType,
  deleteType,
};
