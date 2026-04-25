import { Request, Response, NextFunction } from 'express';
import { slotSuggestionService } from '../services/slotSuggestionService';
import { successResponse } from '../utils/response';

export const getSuggestedSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = {
      doctorId: req.query['doctorId'] as string | undefined,
      specialisation: req.query['specialisation'] as string | undefined,
      preferredDate: req.query['preferredDate'] as string | undefined,
    };
    const result = await slotSuggestionService.getSuggestedSlots(dto);
    res.status(200).json(successResponse(result, 'Slots retrieved'));
  } catch (err) {
    next(err);
  }
};

export const getSlotsByDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.params['doctorId'] as string;
    const date = req.query['date'] ? new Date(req.query['date'] as string) : undefined;
    const result = await slotSuggestionService.getAvailableSlotsByDoctor(doctorId, date);
    res.status(200).json(successResponse(result, 'Slots retrieved'));
  } catch (err) {
    next(err);
  }
};
