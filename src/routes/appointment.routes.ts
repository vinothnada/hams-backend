import { Router } from 'express';
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
} from '../controllers/appointmentController';
import { authenticate } from '../middleware/authenticate';
import { authorise } from '../middleware/authorise';
import { validate } from '../middleware/validate';
import { createAppointmentSchema, updateAppointmentSchema } from '../validators/appointment.validator';
import { UserRole } from '../models/User';

const router = Router();

router.post('/', authenticate, authorise(UserRole.PATIENT), validate(createAppointmentSchema), createAppointment);
router.get('/my', authenticate, authorise(UserRole.PATIENT, UserRole.DOCTOR), getMyAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.patch('/:id/status', authenticate, validate(updateAppointmentSchema), updateAppointment);

export default router;
