import timeOffTypeService from './timeOffType.service.js';
import { ok } from '../../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const types = await timeOffTypeService.listTypes(req.query);
  return ok(res, types);
};

export const getById = async (req, res) => {
  const type = await timeOffTypeService.getTypeById(req.params.id);
  return ok(res, type);
};

export const create = async (req, res) => {
  const type = await timeOffTypeService.createType(req.body);
  return ok(res, type, undefined, 201);
};

export const update = async (req, res) => {
  const type = await timeOffTypeService.updateType(req.params.id, req.body);
  return ok(res, type);
};

export const remove = async (req, res) => {
  await timeOffTypeService.deleteType(req.params.id);
  return ok(res, { message: 'Time off type deleted successfully' });
};

export default {
  list,
  getById,
  create,
  update,
  remove,
};
