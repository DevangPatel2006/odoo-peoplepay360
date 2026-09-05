import userService from './user.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query);
  return ok(res, users, meta);
};

export const getById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ok(res, user);
};

export const create = async (req, res) => {
  const user = await userService.createUser(req.body);
  return ok(res, user, undefined, 201);
};

export const update = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return ok(res, user);
};

export const remove = async (req, res) => {
  await userService.deleteUser(req.params.id);
  return ok(res, { message: 'User deleted successfully' });
};

export const addRole = async (req, res) => {
  const user = await userService.assignUserRole(req.params.id, req.body.role_id);
  return ok(res, user);
};

export const removeRole = async (req, res) => {
  const user = await userService.removeUserRole(req.params.id, req.params.roleId);
  return ok(res, user);
};

export const setRoles = async (req, res) => {
  const roleIds = req.body.role_ids || (req.body.role_id ? [req.body.role_id] : []);
  const user = await userService.updateUserRoles(req.params.id, roleIds);
  return ok(res, user);
};

export const getRoles = async (req, res) => {
  const roles = await userService.getRoles();
  return ok(res, roles);
};

export default {
  list,
  getById,
  create,
  update,
  remove,
  addRole,
  removeRole,
  setRoles,
  getRoles,
};
