import { Request, Response, NextFunction } from 'express';
import { ehrService } from '../services/ehrService';
import { Patient } from '../models/Patient';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';
import { UserRole } from '../models/User';
import { NotFoundError } from '../utils/errors';

export const getMyEHR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const patient = await Patient.findOne({ userId });
    if (!patient) throw new NotFoundError('Patient profile');

    const result = await ehrService.getEHRByPatientId(
      (patient._id as object).toString(),
      userId,
      UserRole.PATIENT
    );
    res.status(200).json(successResponse(result, 'EHR retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getPatientEHR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role } = (req as AuthRequest).user!;
    const result = await ehrService.getEHRByPatientId(req.params['patientId'] as string, userId, role as UserRole);
    res.status(200).json(successResponse(result, 'EHR retrieved'));
  } catch (err) {
    next(err);
  }
};

export const updateEHR = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const patient = await Patient.findOne({ userId });
    if (!patient) throw new NotFoundError('Patient profile');

    const result = await ehrService.updateEHR((patient._id as object).toString(), req.body);
    res.status(200).json(successResponse(result, 'EHR updated'));
  } catch (err) {
    next(err);
  }
};

export const addClinicalNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = (req as AuthRequest).user!;
    const result = await ehrService.addClinicalNote(
      req.params['patientId'] as string,
      userId,
      req.body.note
    );
    res.status(200).json(successResponse(result, 'Clinical note added'));
  } catch (err) {
    next(err);
  }
};
