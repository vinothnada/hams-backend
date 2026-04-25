import { Router } from 'express';
import { getSuggestedSlots, getSlotsByDoctor } from '../controllers/slotController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { getSlotsQuerySchema } from '../validators/slot.validator';

const router = Router();

router.get('/suggest', authenticate, validate(getSlotsQuerySchema, 'query'), getSuggestedSlots);
router.get('/doctor/:doctorId', authenticate, getSlotsByDoctor);

export default router;
