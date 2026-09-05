import jobPositionService from './jobPosition.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const positions = await jobPositionService.listJobPositions(
    req.user.companyId,
    req.query.department_id ? parseInt(req.query.department_id, 10) : null
  );
  return ok(res, positions);
};

export const getById = async (req, res) => {
  const position = await jobPositionService.getJobPositionById(req.params.id, req.user.companyId);
  return ok(res, position);
};

export const create = async (req, res) => {
  const position = await jobPositionService.createJobPosition(req.user.companyId, req.body);
  return ok(res, position, undefined, 201);
};

export const update = async (req, res) => {
  const position = await jobPositionService.updateJobPosition(req.params.id, req.user.companyId, req.body);
  return ok(res, position);
};

export const remove = async (req, res) => {
  await jobPositionService.deleteJobPosition(req.params.id, req.user.companyId);
  return ok(res, { message: 'Job position deleted successfully' });
};

export default {
  list,
  getById,
  create,
  update,
  remove,
};
