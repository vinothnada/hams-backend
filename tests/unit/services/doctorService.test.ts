import { DoctorService } from '../../../src/services/doctorService';
import { NotFoundError, ConflictError } from '../../../src/utils/errors';

jest.mock('../../../src/models/Doctor');
jest.mock('../../../src/models/TimeSlot');
jest.mock('../../../src/models/Appointment');

const { Doctor } = jest.requireMock('../../../src/models/Doctor');
const { TimeSlot } = jest.requireMock('../../../src/models/TimeSlot');
const { Appointment } = jest.requireMock('../../../src/models/Appointment');

describe('DoctorService', () => {
  let service: DoctorService;

  beforeEach(() => {
    service = new DoctorService();
    jest.clearAllMocks();
  });

  describe('getAllDoctors()', () => {
    it('returns list of doctors', async () => {
      Doctor.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 'doc1' }]) }) });
      const result = await service.getAllDoctors({});
      expect(result).toHaveLength(1);
    });

    it('applies specialisation filter', async () => {
      Doctor.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      await service.getAllDoctors({ specialisation: 'Cardiology' });
      expect(Doctor.find).toHaveBeenCalledWith(expect.objectContaining({ specialisation: 'Cardiology' }));
    });
  });

  describe('getDoctorById()', () => {
    it('returns doctor when found', async () => {
      Doctor.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: 'doc1' }) });
      const result = await service.getDoctorById('doc1');
      expect(result).toHaveProperty('_id', 'doc1');
    });

    it('throws NotFoundError when doctor not found', async () => {
      Doctor.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await expect(service.getDoctorById('doc1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDoctorByUserId()', () => {
    it('returns doctor by userId', async () => {
      Doctor.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: 'doc1' }) });
      const result = await service.getDoctorByUserId('user1');
      expect(result).toHaveProperty('_id', 'doc1');
    });

    it('throws NotFoundError when not found', async () => {
      Doctor.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await expect(service.getDoctorByUserId('user1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('setAvailability()', () => {
    const futureSlots = [
      {
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
        durationMinutes: 30,
      },
    ];

    it('creates slots for a valid doctor', async () => {
      Doctor.findById.mockResolvedValue({ _id: 'doc1' });
      TimeSlot.insertMany.mockResolvedValue([{ _id: 'slot1' }]);
      const result = await service.setAvailability('doc1', futureSlots);
      expect(TimeSlot.insertMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundError for non-existent doctor', async () => {
      Doctor.findById.mockResolvedValue(null);
      await expect(service.setAvailability('doc1', futureSlots)).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when slots overlap on same day', async () => {
      Doctor.findById.mockResolvedValue({ _id: 'doc1' });
      const tomorrow = new Date(Date.now() + 86400000);
      const overlap = [
        { startTime: new Date(tomorrow.setHours(9, 0)).toISOString(), endTime: new Date(tomorrow.setHours(10, 0)).toISOString() },
        { startTime: new Date(tomorrow.setHours(9, 30)).toISOString(), endTime: new Date(tomorrow.setHours(10, 30)).toISOString() },
      ];
      await expect(service.setAvailability('doc1', overlap)).rejects.toThrow(ConflictError);
    });
  });

  describe('getSchedule()', () => {
    it('returns appointments sorted by slot start time', async () => {
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'appt1' }]),
      });
      const result = await service.getSchedule('doc1');
      expect(result).toHaveLength(1);
    });
  });
});
