import { AppError } from '../utils/AppError.js';

// Validates req[part] against a zod schema and replaces it with the
// parsed/coerced value on success. This is the API-boundary shape/type check
// only — services still own business-rule validation (uniqueness, cross-field
// checks, password strength policy, etc).
export const validate = (schema, part = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError('Validation failed', 400, errors));
  }
  req[part] = result.data;
  next();
};
