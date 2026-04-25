import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, UserRole } from '../models/User';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { EHR } from '../models/EHR';
import { ConflictError, UnauthorizedError } from '../utils/errors';

interface RegisterDto {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  contactNumber: string;
  specialisation?: string;
  licenseNumber?: string;
  consultationFee?: number;
}

const signTokens = (
  userId: string,
  email: string,
  role: UserRole
): { token: string; refreshToken: string } => {
  const token = jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId, email, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { token, refreshToken };
};

export class AuthService {
  async register(
    data: RegisterDto
  ): Promise<{ user: object; token: string; refreshToken: string }> {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw new ConflictError('Email already registered');

    const user = await User.create({
      email: data.email,
      passwordHash: data.password,
      role: data.role,
    });

    if (data.role === UserRole.PATIENT) {
      const patient = await Patient.create({
        userId: user._id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        contactNumber: data.contactNumber,
      });
      await EHR.create({ patientId: patient._id });
    }

    if (data.role === UserRole.DOCTOR) {
      await Doctor.create({
        userId: user._id,
        firstName: data.firstName,
        lastName: data.lastName,
        specialisation: data.specialisation,
        licenseNumber: data.licenseNumber,
        contactNumber: data.contactNumber,
        consultationFee: data.consultationFee ?? 0,
      });
    }

    const { token, refreshToken } = signTokens(
      (user._id as object).toString(),
      user.email,
      user.role
    );
    return { user: user.toJSON(), token, refreshToken };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: object; token: string; refreshToken: string }> {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await user.comparePassword(password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedError('Account inactive');

    const { token, refreshToken } = signTokens(
      (user._id as object).toString(),
      user.email,
      user.role
    );
    return { user: user.toJSON(), token, refreshToken };
  }

  async refreshToken(token: string): Promise<{ token: string; refreshToken: string }> {
    let decoded: { userId: string; email: string; role: UserRole };
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as typeof decoded;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) throw new UnauthorizedError('Account inactive');

    return signTokens((user._id as object).toString(), user.email, user.role);
  }
}

export const authService = new AuthService();
