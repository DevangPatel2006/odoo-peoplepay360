import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { fail } from '../common/utils/apiResponse.js';

/**
 * Authentication Middleware
 * Validates incoming Bearer JWT and attaches req.user
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = {
      id: decoded.sub,
      employeeId: decoded.employee_id || null,
      companyId: decoded.company_id || null,
      roles: decoded.roles || [],
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
    }
    return fail(res, 401, 'INVALID_TOKEN', 'Authentication token is invalid');
  }
};

export default authenticate;
