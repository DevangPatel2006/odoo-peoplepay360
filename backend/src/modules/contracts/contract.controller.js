import contractService from './contract.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await contractService.listContracts(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const contract = await contractService.getContractById(req.params.id, req.user);
  return ok(res, contract);
};

export const create = async (req, res) => {
  const contract = await contractService.createContract(req.user, req.body);
  return ok(res, contract, undefined, 201);
};

export const update = async (req, res) => {
  const contract = await contractService.updateContract(req.params.id, req.user, req.body);
  return ok(res, contract);
};

export const remove = async (req, res) => {
  await contractService.deleteContract(req.params.id, req.user);
  return ok(res, { message: 'Contract deleted successfully' });
};

export const getApplicable = async (req, res) => {
  const contract = await contractService.resolveApplicableContract(req.user, req.query);
  return ok(res, contract);
};

export default {
  list,
  getById,
  create,
  update,
  remove,
  getApplicable,
};
