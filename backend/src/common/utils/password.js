import crypto from 'crypto';

/**
 * Generates a readable-but-strong temporary password, e.g. "Xk4-Tqp9-Rw2m"
 * @returns {string}
 */
export const generateTemporaryPassword = () => {
  const raw = crypto.randomBytes(9).toString('base64url'); // URL-safe, no ambiguous chars issue
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
};

export default {
  generateTemporaryPassword,
};
