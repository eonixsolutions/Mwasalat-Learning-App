import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { mwasalatAuthService } from './mwasalatAuth.service.js';

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AppError('Authentication required', 401);

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  if (decoded.type !== mwasalatAuthService.TOKEN_TYPE) {
    throw new AppError('Invalid token for this resource', 401);
  }

  const user = await mwasalatAuthService.getMe(decoded.id);
  req.mwasalatUser = { ...user, role: decoded.role };
  next();
});

const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.mwasalatUser.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  });

export const mwasalatAuthMiddleware = { authenticate, authorize };
