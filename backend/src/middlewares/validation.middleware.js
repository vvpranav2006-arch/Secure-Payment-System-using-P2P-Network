const AppError = require('../utils/AppError');

/**
 * Middleware factory for validating request components using Zod schemas
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      // Replace req[source] with parsed/sanitized value (type coercion, defaults applied)
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const errorDetails = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError('Validation failed', 400, errorDetails));
      }
      return next(err);
    }
  };
};

module.exports = validate;

