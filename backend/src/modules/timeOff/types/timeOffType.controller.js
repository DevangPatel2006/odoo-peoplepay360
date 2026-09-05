import timeOffModel from '../timeOff.model.js';
import { ok } from '../../../common/utils/apiResponse.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const list = async (req, res) => {
  const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
  const types = await timeOffModel.findTypes(isActive);
  return ok(res, types);
};

export const getById = async (req, res) => {
  const type = await timeOffModel.findTypeById(req.params.id);
  if (!type) {
    throw new AppError('Time off type not found', 404, 'NOT_FOUND');
  }
  return ok(res, type);
};

export const create = async (req, res) => {
  const type = await timeOffModel.createType(req.body);
  return ok(res, type, undefined, 201);
};

export const update = async (req, res) => {
  await getById(req, res);
  const type = await timeOffModel.updateType(req.params.id, req.body);
  return ok(res, type);
};

export const remove = async (req, res) => {
  await getById(req, res);
  await timeOffModel.removeType(req.params.id);
  return ok(res, { message: 'Time off type deleted successfully' });
};

export default {
  list,
  getById,
  create,
  update,
  remove,
};
