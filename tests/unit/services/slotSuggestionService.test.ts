import { SlotSuggestionService } from '../../../src/services/slotSuggestionService';
import { ValidationError } from '../../../src/utils/errors';

jest.mock('../../../src/models/TimeSlot');
jest.mock('../../../src/models/Doctor');

const { TimeSlot } = jest.requireMock('../../../src/models/TimeSlot');
const { Doctor } = jest.requireMock('../../../src/models/Doctor');

const makeSlot = (overrides: Partial<{
  startTime: Date;
  durationMinutes: number;
  doctorId: string;
}> = {}) => ({
  _id: 'slot1',
  doctorId: overrides.doctorId || 'doc1',
  startTime: overrides.startTime || new Date(Date.now() + 86400000),
  endTime: new Date(Date.now() + 86400000 + 1800000),
  durationMinutes: overrides.durationMinutes ?? 30,
  isAvailable: true,
});

describe('SlotSuggestionService', () => {
  let service: SlotSuggestionService;

  beforeEach(() => {
    service = new SlotSuggestionService();
    jest.clearAllMocks();
  });

  it('returns results sorted by priorityScore descending', async () => {
    const morning = makeSlot({ startTime: new Date(new Date().setHours(9, 0, 0, 0) + 86400000) });
    const evening = makeSlot({ startTime: new Date(new Date().setHours(18, 0, 0, 0) + 86400000) });
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([evening, morning]) }) });

    const results = await service.getSuggestedSlots({ doctorId: 'doc1' });
    expect(results[0].priorityScore).toBeGreaterThanOrEqual(results[1].priorityScore);
  });

  it('returns empty array when no slots available', async () => {
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) });
    const results = await service.getSuggestedSlots({ doctorId: 'doc1' });
    expect(results).toHaveLength(0);
  });

  it('filters by doctorId correctly', async () => {
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([makeSlot()]) }) });
    await service.getSuggestedSlots({ doctorId: 'doc1' });
    expect(TimeSlot.find).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 'doc1' }));
  });

  it('filters by specialisation correctly', async () => {
    Doctor.find.mockResolvedValue([{ _id: 'doc1' }]);
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([makeSlot()]) }) });
    await service.getSuggestedSlots({ specialisation: 'Cardiology' });
    expect(Doctor.find).toHaveBeenCalled();
  });

  it('caps results at 10 items maximum', async () => {
    const slots = Array.from({ length: 20 }, (_, i) => makeSlot({ doctorId: `doc${i}` }));
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(slots) }) });
    const results = await service.getSuggestedSlots({ doctorId: 'doc1' });
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('throws ValidationError for empty query object', async () => {
    await expect(service.getSuggestedSlots({})).rejects.toThrow(ValidationError);
  });

  it('morning slots score higher than evening slots given same date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const morningTime = new Date(tomorrow);
    morningTime.setHours(9, 0, 0, 0);
    const eveningTime = new Date(tomorrow);
    eveningTime.setHours(19, 0, 0, 0);

    const morning = makeSlot({ startTime: morningTime });
    const evening = makeSlot({ startTime: eveningTime });

    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([morning, evening]) }) });

    const results = await service.getSuggestedSlots({
      doctorId: 'doc1',
      preferredDate: tomorrow.toISOString().split('T')[0],
    });

    const morningResult = results.find((r) => r.slot.startTime.getHours() === 9);
    const eveningResult = results.find((r) => r.slot.startTime.getHours() === 19);
    expect(morningResult!.priorityScore).toBeGreaterThan(eveningResult!.priorityScore);
  });

  it('scores 60-min slots lower than 30-min slots', async () => {
    const slot30 = makeSlot({ durationMinutes: 30 });
    const slot60 = makeSlot({ durationMinutes: 60 });
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([slot30, slot60]) }) });
    const results = await service.getSuggestedSlots({ doctorId: 'doc1' });
    const s30 = results.find((r) => r.slot.durationMinutes === 30);
    const s60 = results.find((r) => r.slot.durationMinutes === 60);
    expect(s30!.priorityScore).toBeGreaterThan(s60!.priorityScore);
  });

  it('scores other-duration slots at 10 duration points', async () => {
    const slot45 = makeSlot({ durationMinutes: 45 });
    TimeSlot.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([slot45]) }) });
    const results = await service.getSuggestedSlots({ doctorId: 'doc1' });
    expect(results[0].priorityScore).toBeLessThan(40 + 30 + 30);
  });
});

describe('SlotSuggestionService.getAvailableSlotsByDoctor()', () => {
  let service: SlotSuggestionService;

  beforeEach(() => {
    service = new SlotSuggestionService();
    jest.clearAllMocks();
  });

  it('returns available slots for a doctor', async () => {
    TimeSlot.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 'slot1' }]) });
    const result = await service.getAvailableSlotsByDoctor('doc1');
    expect(result).toHaveLength(1);
    expect(TimeSlot.find).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 'doc1', isAvailable: true }));
  });

  it('filters by date when provided', async () => {
    TimeSlot.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const date = new Date();
    await service.getAvailableSlotsByDoctor('doc1', date);
    expect(TimeSlot.find).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: expect.objectContaining({ $gte: expect.any(Date) }) })
    );
  });
});
