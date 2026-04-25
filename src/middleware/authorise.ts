import { Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AuthRequest } from './authenticate';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorise =
  (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
