import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  setAvailability,
  getMySchedule,
} from '../controllers/doctorController';
import { authenticate } from '../middleware/authenticate';
import { authorise } from '../middleware/authorise';
import { validate } from '../middleware/validate';
import { setAvailabilitySchema } from '../validators/doctor.validator';
import { UserRole } from '../models/User';

const router = Router();

router.get('/', getAllDoctors);
router.get('/schedule/my', authenticate, authorise(UserRole.DOCTOR), getMySchedule);
router.post('/availability', authenticate, authorise(UserRole.DOCTOR), validate(setAvailabilitySchema), setAvailability);
router.get('/:id', getDoctorById);

export default router;
