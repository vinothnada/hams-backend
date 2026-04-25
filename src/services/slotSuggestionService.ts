import { TimeSlot, ITimeSlot } from '../models/TimeSlot';
import { Doctor } from '../models/Doctor';
import { ValidationError } from '../utils/errors';

interface SuggestDto {
  doctorId?: string;
  specialisation?: string;
  preferredDate?: string;
}

interface ScoredSlot {
  slot: ITimeSlot;
  priorityScore: number;
}

const scoreTiming = (startTime: Date): number => {
  const hour = startTime.getHours();
  if (hour >= 8 && hour < 12) return 30;
  if (hour >= 12 && hour < 17) return 20;
  return 10;
};

const scoreDuration = (minutes: number): number => {
  if (minutes === 30) return 30;
  if (minutes === 60) return 20;
  return 10;
};

const scoreProximity = (slotDate: Date, preferred: Date): number => {
  const diffMs = Math.abs(slotDate.getTime() - preferred.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, 40 - diffDays * 10);
};

export class SlotSuggestionService {
  async getSuggestedSlots(dto: SuggestDto): Promise<ScoredSlot[]> {
    if (!dto.doctorId && !dto.specialisation && !dto.preferredDate) {
      throw new ValidationError('At least one search parameter is required');
    }

    const query: Record<string, unknown> = { isAvailable: true };

    if (dto.doctorId) {
      query['doctorId'] = dto.doctorId;
    } else if (dto.specialisation) {
      const doctors = await Doctor.find({ specialisation: dto.specialisation, isAvailable: true });
      query['doctorId'] = { $in: doctors.map((d) => d._id) };
    }

    const preferred = dto.preferredDate ? new Date(dto.preferredDate) : new Date();

    if (dto.preferredDate) {
      const from = new Date(preferred);
      from.setDate(from.getDate() - 3);
      const to = new Date(preferred);
      to.setDate(to.getDate() + 3);
      query['startTime'] = { $gte: from, $lte: to };
    }

    const slots = await TimeSlot.find(query).populate('doctorId').limit(50);

    const scored: ScoredSlot[] = slots.map((slot) => {
      const proximity = scoreProximity(slot.startTime, preferred);
      const timing = scoreTiming(slot.startTime);
      const duration = scoreDuration(slot.durationMinutes);
      return { slot, priorityScore: proximity + timing + duration };
    });

    return scored.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 10);
  }

  async getAvailableSlotsByDoctor(doctorId: string, date?: Date): Promise<ITimeSlot[]> {
    const query: Record<string, unknown> = { doctorId, isAvailable: true };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query['startTime'] = { $gte: start, $lte: end };
    }

    return TimeSlot.find(query).sort({ startTime: 1 });
  }
}

export const slotSuggestionService = new SlotSuggestionService();
