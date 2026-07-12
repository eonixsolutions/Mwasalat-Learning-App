import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError('Validation failed', 422, formatted));
  }
  next();
};
