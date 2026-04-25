import { Router } from 'express';
import { getMyEHR, getPatientEHR, updateEHR, addClinicalNote } from '../controllers/ehrController';
import { authenticate } from '../middleware/authenticate';
import { authorise } from '../middleware/authorise';
import { validate } from '../middleware/validate';
import { updateEHRSchema, addClinicalNoteSchema } from '../validators/ehr.validator';
import { UserRole } from '../models/User';

const router = Router();

router.get('/my', authenticate, authorise(UserRole.PATIENT), getMyEHR);
router.patch('/my', authenticate, authorise(UserRole.PATIENT), validate(updateEHRSchema), updateEHR);
router.get('/:patientId', authenticate, authorise(UserRole.DOCTOR, UserRole.ADMIN), getPatientEHR);
router.post('/:patientId/notes', authenticate, authorise(UserRole.DOCTOR), validate(addClinicalNoteSchema), addClinicalNote);

export default router;
