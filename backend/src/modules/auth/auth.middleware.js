import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository.js';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('Authentication required', 401);

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  const user = await authRepository.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError('User not found or account deactivated', 401);

  // Attach the JWT's active role so authorize() works regardless of multi-role setup
  req.user = { ...user.toJSON(), role: decoded.role };
  next();
});

const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  });

export const authMiddleware = { authenticate, authorize };
