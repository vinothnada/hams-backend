import { Request, Response, NextFunction } from 'express';
import { doctorService } from '../services/doctorService';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';

export const getAllDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      specialisation: req.query['specialisation'] as string | undefined,
      isAvailable:
        req.query['isAvailable'] !== undefined
          ? req.query['isAvailable'] === 'true'
          : undefined,
    };
    const result = await doctorService.getAllDoctors(filters);
    res.status(200).json(successResponse(result, 'Doctors retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getDoctorById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await doctorService.getDoctorById(req.params['id'] as string);
    res.status(200).json(successResponse(result, 'Doctor retrieved'));
  } catch (err) {
    next(err);
  }
};

export const setAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const doctor = await doctorService.getDoctorByUserId(userId);
    const result = await doctorService.setAvailability(
      (doctor._id as object).toString(),
      req.body.slots
    );
    res.status(201).json(successResponse(result, 'Availability set', 201));
  } catch (err) {
    next(err);
  }
};

export const getMySchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const doctor = await doctorService.getDoctorByUserId(userId);
    const result = await doctorService.getSchedule((doctor._id as object).toString());
    res.status(200).json(successResponse(result, 'Schedule retrieved'));
  } catch (err) {
    next(err);
  }
};
