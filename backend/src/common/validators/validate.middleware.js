/**
 * Generic Express Middleware for Joi Schema Validation
 *
 * @param {import('joi').Schema} schema - Joi validation schema
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(error);
    }

    req[source] = value;
    return next();
  };
};

export default validate;
