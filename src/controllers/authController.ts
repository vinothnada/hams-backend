import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(successResponse(result, 'Registration successful', 201));
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(successResponse(result, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.status(200).json(successResponse(result, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthRequest).user;
    res.status(200).json(successResponse(user, 'User retrieved'));
  } catch (err) {
    next(err);
  }
};
