/**
 * Standardized API Response Envelopes
 * Enforces Part A3 across all modules
 */

/**
 * Standard Success Response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {object} [meta]
 * @param {number} [status=200]
 */
export const ok = (res, data, meta = undefined, status = 200) => {
  const responsePayload = {
    success: true,
    data,
  };

  if (meta !== undefined) {
    responsePayload.meta = meta;
  }

  return res.status(status).json(responsePayload);
};

/**
 * Standard Error Response
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {Array|object} [details=[]]
 */
export const fail = (res, status, code, message, details = []) => {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: Array.isArray(details) ? details : [details],
    },
  });
};

export default {
  ok,
  fail,
};
