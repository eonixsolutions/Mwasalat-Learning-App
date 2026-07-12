import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateKey = (err) =>
  new AppError(`Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`, 409);
const handleValidationError = (err) =>
  new AppError(Object.values(err.errors).map((e) => e.message).join(', '), 400);
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401);

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!error.isOperational) {
    if (error.name === 'CastError') error = handleCastError(error);
    else if (error.code === 11000) error = handleDuplicateKey(error);
    else if (error.name === 'ValidationError') error = handleValidationError(error);
    else if (error.name === 'JsonWebTokenError') error = handleJWTError();
    else if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    else {
      logger.error(error);
      error = new AppError('Something went wrong', 500);
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    data: null,
    code: error.code || null,
    error: error.errors || null,
  });
};
