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

// Same decode as authenticate(), but a missing/invalid/expired token is not
// an error here — req.mwasalatUser is just left null and the request
// proceeds. For routes that personalize their response when a caller happens
// to be logged in (e.g. the public course catalog) without requiring it.
const authenticateOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.mwasalatUser = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.type !== mwasalatAuthService.TOKEN_TYPE) {
      req.mwasalatUser = null;
      return next();
    }
    const user = await mwasalatAuthService.getMe(decoded.id);
    req.mwasalatUser = { ...user, role: decoded.role };
  } catch {
    req.mwasalatUser = null;
  }
  next();
};

export const mwasalatAuthMiddleware = { authenticate, authorize, authenticateOptional };
