import allocationService from './allocation.service.js';
import { ok } from '../../../common/utils/apiResponse.js';

export const listAllocationsDirect = async (user, queryParams = {}) => {
  return allocationService.listAllocations(user, queryParams);
};

export const list = async (req, res) => {
  const { data, meta } = await allocationService.listAllocations(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const allocation = await allocationService.getAllocationById(req.params.id, req.user);
  return ok(res, allocation);
};

export const create = async (req, res) => {
  const allocation = await allocationService.createAllocation(req.user, req.body);
  return ok(res, allocation, undefined, 201);
};

export const update = async (req, res) => {
  const updated = await allocationService.updateAllocation(req.params.id, req.user, req.body);
  return ok(res, updated);
};

export const approve = async (req, res) => {
  const updated = await allocationService.approveAllocation(req.params.id, req.user);
  return ok(res, updated);
};

export const refuse = async (req, res) => {
  const updated = await allocationService.refuseAllocation(req.params.id, req.user);
  return ok(res, updated);
};

export const remove = async (req, res) => {
  await allocationService.deleteAllocation(req.params.id, req.user);
  return ok(res, { message: 'Allocation deleted successfully' });
};

export default {
  listAllocationsDirect,
  list,
  getById,
  create,
  update,
  approve,
  refuse,
  remove,
};
