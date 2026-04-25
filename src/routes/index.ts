import { Router } from 'express';
import authRoutes from './auth.routes';
import appointmentRoutes from './appointment.routes';
import doctorRoutes from './doctor.routes';
import slotRoutes from './slot.routes';
import ehrRoutes from './ehr.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/appointments', appointmentRoutes);
router.use('/api/v1/doctors', doctorRoutes);
router.use('/api/v1/slots', slotRoutes);
router.use('/api/v1/ehr', ehrRoutes);

export default router;
