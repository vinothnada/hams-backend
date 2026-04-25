import { Request, Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointmentService';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';
import { AppointmentStatus } from '../models/Appointment';
import { UserRole } from '../models/User';

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const result = await appointmentService.createAppointment(userId, req.body);
    res.status(201).json(successResponse(result, 'Appointment created', 201));
  } catch (err) {
    next(err);
  }
};

export const getMyAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role } = (req as AuthRequest).user!;
    const status = req.query['status'] as string | undefined;
    const result =
      role === UserRole.DOCTOR
        ? await appointmentService.getDoctorAppointments(userId, status)
        : await appointmentService.getPatientAppointments(userId, status);
    res.status(200).json(successResponse(result, 'Appointments retrieved'));
  } catch (err) {
    next(err);
  }
};

export const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role } = (req as AuthRequest).user!;
    const id = req.params['id'] as string;
    const result = await appointmentService.updateAppointmentStatus(
      id,
      userId,
      role as UserRole,
      { status: req.body.status as AppointmentStatus, cancelReason: req.body.cancelReason }
    );
    res.status(200).json(successResponse(result, 'Appointment updated'));
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await appointmentService.getAppointmentById(req.params['id'] as string);
    res.status(200).json(successResponse(result, 'Appointment retrieved'));
  } catch (err) {
    next(err);
  }
};
