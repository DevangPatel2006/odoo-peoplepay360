import requestService from './request.service.js';
import { ok } from '../../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await requestService.listRequests(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const request = await requestService.getRequestById(req.params.id, req.user);
  return ok(res, request);
};

export const create = async (req, res) => {
  const request = await requestService.createRequest(req.user, req.body);
  return ok(res, request, undefined, 201);
};

export const approve = async (req, res) => {
  const request = await requestService.approveRequest(req.params.id, req.user, req.body);
  return ok(res, request);
};

export const refuse = async (req, res) => {
  const request = await requestService.refuseRequest(req.params.id, req.user, req.body);
  return ok(res, request);
};

export const remove = async (req, res) => {
  await requestService.deleteRequest(req.params.id, req.user);
  return ok(res, { message: 'Time off request deleted successfully' });
};

export default {
  list,
  getById,
  create,
  approve,
  refuse,
  remove,
};
