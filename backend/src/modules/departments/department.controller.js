import departmentService from './department.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const departments = await departmentService.listDepartments(req.user.companyId);
  return ok(res, departments);
};

export const getById = async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id, req.user.companyId);
  return ok(res, department);
};

export const create = async (req, res) => {
  const department = await departmentService.createDepartment(req.user.companyId, req.body);
  return ok(res, department, undefined, 201);
};

export const update = async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.user.companyId, req.body);
  return ok(res, department);
};

export const remove = async (req, res) => {
  await departmentService.deleteDepartment(req.params.id, req.user.companyId);
  return ok(res, { message: 'Department deleted successfully' });
};

export default {
  list,
  getById,
  create,
  update,
  remove,
};
