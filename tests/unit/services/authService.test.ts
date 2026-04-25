import { AuthService } from '../../../src/services/authService';
import { ConflictError, UnauthorizedError } from '../../../src/utils/errors';
import { UserRole } from '../../../src/models/User';

jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Patient');
jest.mock('../../../src/models/Doctor');
jest.mock('../../../src/models/EHR');

const { User } = jest.requireMock('../../../src/models/User');
const { Patient } = jest.requireMock('../../../src/models/Patient');
const { Doctor } = jest.requireMock('../../../src/models/Doctor');
const { EHR } = jest.requireMock('../../../src/models/EHR');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('register()', () => {
    const patientData = {
      email: 'patient@test.com',
      password: 'Pass@123',
      role: UserRole.PATIENT,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      contactNumber: '+1234567890',
    };

    const mockUser = {
      _id: 'user123',
      email: patientData.email,
      role: UserRole.PATIENT,
      toJSON: () => ({ _id: 'user123', email: patientData.email }),
    };

    it('returns user and tokens on success', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      Patient.create.mockResolvedValue({ _id: 'patient123' });
      EHR.create.mockResolvedValue({});

      const result = await service.register(patientData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('throws ConflictError for duplicate email', async () => {
      User.findOne.mockResolvedValue({ email: patientData.email });
      await expect(service.register(patientData)).rejects.toThrow(ConflictError);
    });

    it('creates Patient profile for PATIENT role', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      Patient.create.mockResolvedValue({ _id: 'patient123' });
      EHR.create.mockResolvedValue({});

      await service.register(patientData);
      expect(Patient.create).toHaveBeenCalledTimes(1);
      expect(EHR.create).toHaveBeenCalledTimes(1);
    });

    it('creates Doctor profile for DOCTOR role', async () => {
      const doctorData = {
        ...patientData,
        role: UserRole.DOCTOR,
        specialisation: 'Cardiology',
        licenseNumber: 'LIC123',
        consultationFee: 150,
      };
      const doctorUser = { ...mockUser, role: UserRole.DOCTOR };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(doctorUser);
      Doctor.create.mockResolvedValue({});

      await service.register(doctorData);
      expect(Doctor.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('login()', () => {
    const mockUser = {
      _id: 'user123',
      email: 'user@test.com',
      role: UserRole.PATIENT,
      isActive: true,
      comparePassword: jest.fn(),
      toJSON: () => ({ _id: 'user123', email: 'user@test.com' }),
    };

    it('returns tokens on valid credentials', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      mockUser.comparePassword.mockResolvedValue(true);

      const result = await service.login('user@test.com', 'Pass@123');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedError for wrong password', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(service.login('user@test.com', 'wrong')).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      inactiveUser.comparePassword = jest.fn().mockResolvedValue(true);
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(inactiveUser) });

      await expect(service.login('user@test.com', 'Pass@123')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken()', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const activeUser = { _id: 'user123', email: 'user@test.com', role: UserRole.PATIENT, isActive: true };
      const validToken = require('jsonwebtoken').sign(
        { userId: 'user123', email: 'user@test.com', role: UserRole.PATIENT },
        require('../../../src/config/env').env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      User.findById.mockResolvedValue(activeUser);
      const result = await service.refreshToken(validToken);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedError for an invalid refresh token', async () => {
      await expect(service.refreshToken('invalid.token.here')).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError when user is inactive', async () => {
      const validToken = require('jsonwebtoken').sign(
        { userId: 'user123', email: 'user@test.com', role: UserRole.PATIENT },
        require('../../../src/config/env').env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      User.findById.mockResolvedValue({ _id: 'user123', isActive: false });
      await expect(service.refreshToken(validToken)).rejects.toThrow(UnauthorizedError);
    });
  });
});
