import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { UserRole } from '../../src/models/User';

export const signTestToken = (payload: {
  userId: string;
  email: string;
  role: UserRole;
}): string => jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
