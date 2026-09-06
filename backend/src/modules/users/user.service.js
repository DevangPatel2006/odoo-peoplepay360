import bcrypt from 'bcrypt';
import userModel from './user.model.js';
import env from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';

export const listUsers = async ({ page = 1, pageSize = 200, search = '' } = {}) => {
  const limit = Math.min(parseInt(pageSize, 10) || 200, 500);
  const offset = ((parseInt(page, 10) || 1) - 1) * limit;

  const { rows, total } = await userModel.findAll({ limit, offset, search: String(search || '').trim() });
  return {
    users: rows,
    meta: {
      page: parseInt(page, 10) || 1,
      pageSize: limit,
      total,
    },
  };
};

export const getUserById = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return user;
};

export const createUser = async ({ employee_id, work_email, password, is_active = true, role_ids = [] }) => {
  const passwordHash = await bcrypt.hash(password, env.security.saltRounds);
  const user = await userModel.create({
    employee_id,
    work_email,
    password_hash: passwordHash,
    is_active,
  });

  if (Array.isArray(role_ids)) {
    for (const roleId of role_ids) {
      await userModel.addRole(user.id, roleId);
    }
  }

  return userModel.findById(user.id);
};

export const updateUser = async (id, data) => {
  const existing = await getUserById(id);

  const updates = {};
  if (data.work_email !== undefined) updates.work_email = data.work_email;
  if (data.employee_id !== undefined) updates.employee_id = data.employee_id;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  if (data.password) {
    updates.password_hash = await bcrypt.hash(data.password, env.security.saltRounds);
  }

  await userModel.update(id, updates);

  if (data.role_ids !== undefined) {
    const ids = Array.isArray(data.role_ids) ? data.role_ids : [data.role_ids];
    await userModel.setUserRoles(id, ids);
  }

  if (data.job_position_id && existing.employee_id) {
    const { query } = await import('../../config/db.js');
    await query('UPDATE employees SET job_position_id = $1 WHERE id = $2', [
      parseInt(data.job_position_id, 10),
      existing.employee_id,
    ]);
  }

  return userModel.findById(id);
};

export const deleteUser = async (id) => {
  await getUserById(id);
  await userModel.remove(id);
  return true;
};

export const assignUserRole = async (userId, roleId) => {
  await getUserById(userId);
  await userModel.addRole(userId, roleId);
  return userModel.findById(userId);
};

export const removeUserRole = async (userId, roleId) => {
  await getUserById(userId);
  await userModel.removeRole(userId, roleId);
  return userModel.findById(userId);
};

export const updateUserRoles = async (userId, roleIds) => {
  await getUserById(userId);
  await userModel.setUserRoles(userId, Array.isArray(roleIds) ? roleIds : [roleIds]);
  return userModel.findById(userId);
};

export const getRoles = async () => {
  return userModel.getAllRoles();
};

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignUserRole,
  removeUserRole,
  updateUserRoles,
  getRoles,
};
