import { fail } from '../common/utils/apiResponse.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST', details = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Centralized Express Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  // If response headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Application-defined custom AppError
  if (err instanceof AppError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }

  // 2. Joi validation error
  if (err.isJoi) {
    const details = err.details?.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    })) || [];
    return fail(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  // 3. PostgreSQL Known Errors
  if (err.code) {
    switch (err.code) {
      // unique_violation
      case '23505': {
        const detail = err.detail || 'A unique constraint was violated';
        return fail(res, 409, 'CONFLICT', 'Resource already exists or unique constraint violated', [detail]);
      }

      // foreign_key_violation
      case '23503': {
        // err.detail usually: "Key (department_id)=(999) is not present in table "departments"."
        // or "Key (id)=(1) is still referenced from table "employees"."
        const detail = err.detail || '';
        let message = 'Foreign key constraint violated';
        if (err.table) {
          message = `Referenced entity in '${err.table}' constraint violated`;
        }
        return fail(res, 409, 'CONFLICT', message, detail ? [detail] : []);
      }

      // check_violation
      case '23514': {
        const constraint = err.constraint ? ` (${err.constraint})` : '';
        return fail(res, 400, 'VALIDATION_ERROR', `Check constraint violated${constraint}`, [err.detail || err.message]);
      }

      // PL/pgSQL RAISE EXCEPTION
      case 'P0001': {
        return fail(res, 422, 'BUSINESS_RULE_VIOLATION', 'Business rule violated', [err.message]);
      }
    }
  }

  // 4. Fallback for unhandled unexpected errors
  console.error('[UNHANDLED_ERROR]', err);
  return fail(res, 500, 'INTERNAL_ERROR', 'An unexpected internal server error occurred', []);
};

export default errorHandler;
