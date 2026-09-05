import authService from './auth.service.js';
import { ok } from '../../common/utils/apiResponse.js';

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  return ok(res, result, undefined, 200);
};

export const me = async (req, res) => {
  const result = await authService.getMe(req.user.id);
  return ok(res, result, undefined, 200);
};

export const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  return ok(res, { message: 'Password updated successfully' }, undefined, 200);
};

export default {
  login,
  me,
  changePassword,
};
