import { AppointmentService } from '../../../src/services/appointmentService';
import { ConflictError, NotFoundError, ForbiddenError } from '../../../src/utils/errors';
import { AppointmentStatus } from '../../../src/models/Appointment';
import { UserRole } from '../../../src/models/User';

jest.mock('../../../src/models/Patient');
jest.mock('../../../src/models/TimeSlot');
jest.mock('../../../src/models/Appointment');
jest.mock('../../../src/services/doctorService');
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };
});

const { Patient } = jest.requireMock('../../../src/models/Patient');
const { TimeSlot } = jest.requireMock('../../../src/models/TimeSlot');
const { Appointment } = jest.requireMock('../../../src/models/Appointment');
const { doctorService } = jest.requireMock('../../../src/services/doctorService');

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(() => {
    service = new AppointmentService();
    jest.clearAllMocks();
  });

  describe('createAppointment()', () => {
    const mockPatient = { _id: 'patient1', userId: 'user1' };
    const mockSlot = { _id: 'slot1', isAvailable: true, save: jest.fn() };
    const mockAppointment = { _id: { toString: () => 'appt1' } };
    const populatedAppointment = { _id: 'appt1', slotId: {}, doctorId: {} };

    it('creates appointment when slot is available', async () => {
      Patient.findOne.mockResolvedValue(mockPatient);
      TimeSlot.findById.mockResolvedValue(mockSlot);
      Appointment.create.mockResolvedValue([mockAppointment]);
      const chain = { populate: jest.fn().mockReturnThis() };
      chain.populate
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce(populatedAppointment);
      Appointment.findById.mockReturnValue(chain);

      await expect(
        service.createAppointment('user1', { slotId: 'slot1', doctorId: 'doc1' })
      ).resolves.toBeDefined();
    });

    it('throws ConflictError when slot not available', async () => {
      Patient.findOne.mockResolvedValue(mockPatient);
      TimeSlot.findById.mockResolvedValue({ ...mockSlot, isAvailable: false });

      await expect(
        service.createAppointment('user1', { slotId: 'slot1', doctorId: 'doc1' })
      ).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError for missing patient', async () => {
      Patient.findOne.mockResolvedValue(null);

      await expect(
        service.createAppointment('user1', { slotId: 'slot1', doctorId: 'doc1' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateAppointmentStatus()', () => {
    const mockAppointment = {
      _id: 'appt1',
      patientId: 'patient1',
      doctorId: 'doc1',
      slotId: 'slot1',
      status: AppointmentStatus.PENDING,
      save: jest.fn(),
      populate: jest.fn().mockReturnThis(),
    };

    it('throws ForbiddenError when PATIENT tries to confirm', async () => {
      Patient.findOne.mockResolvedValue({ _id: 'patient1' });
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ ...mockAppointment, patientId: { toString: () => 'patient1' } }) });

      await expect(
        service.updateAppointmentStatus('appt1', 'user1', UserRole.PATIENT, {
          status: AppointmentStatus.CONFIRMED,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('DOCTOR can confirm own appointment', async () => {
      const appt = {
        ...mockAppointment,
        doctorId: { toString: () => 'doc1' },
        patientId: { toString: () => 'patient1' },
        save: jest.fn(),
      };
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(appt) });
      doctorService.getDoctorByUserId.mockResolvedValue({ _id: { toString: () => 'doc1' } });

      await expect(
        service.updateAppointmentStatus('appt1', 'docUser1', UserRole.DOCTOR, {
          status: AppointmentStatus.CONFIRMED,
        })
      ).resolves.toBeDefined();
    });

    it('PATIENT can cancel own appointment', async () => {
      const appt = {
        ...mockAppointment,
        patientId: { toString: () => 'patient1' },
        doctorId: { toString: () => 'doc1' },
        save: jest.fn(),
      };
      Patient.findOne.mockResolvedValue({ _id: { toString: () => 'patient1' } });
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(appt) });
      TimeSlot.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await expect(
        service.updateAppointmentStatus('appt1', 'user1', UserRole.PATIENT, {
          status: AppointmentStatus.CANCELLED,
          cancelReason: 'Cannot attend',
        })
      ).resolves.toBeDefined();
    });

    it('throws NotFoundError for missing appointment', async () => {
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await expect(
        service.updateAppointmentStatus('bad', 'user1', UserRole.ADMIN, {
          status: AppointmentStatus.CONFIRMED,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('ADMIN can update any appointment', async () => {
      const appt = {
        ...mockAppointment,
        patientId: { toString: () => 'patient1' },
        doctorId: { toString: () => 'doc1' },
        save: jest.fn(),
      };
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(appt) });
      await expect(
        service.updateAppointmentStatus('appt1', 'adminUser', UserRole.ADMIN, {
          status: AppointmentStatus.COMPLETED,
        })
      ).resolves.toBeDefined();
    });

    it('throws ForbiddenError when PATIENT is not the owner', async () => {
      const appt = {
        ...mockAppointment,
        patientId: { toString: () => 'otherPatient' },
        save: jest.fn(),
      };
      Patient.findOne.mockResolvedValue({ _id: { toString: () => 'patient1' } });
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(appt) });
      await expect(
        service.updateAppointmentStatus('appt1', 'user1', UserRole.PATIENT, {
          status: AppointmentStatus.CANCELLED,
          cancelReason: 'Changed plans',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ForbiddenError when DOCTOR tries to cancel', async () => {
      const appt = {
        ...mockAppointment,
        doctorId: { toString: () => 'doc1' },
        patientId: { toString: () => 'patient1' },
        save: jest.fn(),
      };
      Appointment.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(appt) });
      doctorService.getDoctorByUserId.mockResolvedValue({ _id: { toString: () => 'doc1' } });
      await expect(
        service.updateAppointmentStatus('appt1', 'docUser1', UserRole.DOCTOR, {
          status: AppointmentStatus.CANCELLED,
          cancelReason: 'reason',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getPatientAppointments()', () => {
    it('returns appointments for a patient', async () => {
      Patient.findOne.mockResolvedValue({ _id: 'patient1' });
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'appt1' }]),
      });
      const result = await service.getPatientAppointments('user1');
      expect(result).toHaveLength(1);
    });

    it('filters by status when provided', async () => {
      Patient.findOne.mockResolvedValue({ _id: 'patient1' });
      Appointment.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      await service.getPatientAppointments('user1', 'CONFIRMED');
      expect(Appointment.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CONFIRMED' })
      );
    });

    it('throws NotFoundError when patient not found', async () => {
      Patient.findOne.mockResolvedValue(null);
      await expect(service.getPatientAppointments('user1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAppointmentById()', () => {
    it('returns appointment when found', async () => {
      Appointment.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
      });
      const apptChain = { populate: jest.fn().mockReturnThis() };
      apptChain.populate.mockReturnValueOnce(apptChain).mockReturnValueOnce(apptChain).mockResolvedValueOnce({ _id: 'appt1' });
      Appointment.findById.mockReturnValue(apptChain);
      const result = await service.getAppointmentById('appt1');
      expect(result).toHaveProperty('_id', 'appt1');
    });

    it('throws NotFoundError when not found', async () => {
      const chain = { populate: jest.fn().mockReturnThis() };
      chain.populate.mockReturnValueOnce(chain).mockReturnValueOnce(chain).mockResolvedValueOnce(null);
      Appointment.findById.mockReturnValue(chain);
      await expect(service.getAppointmentById('bad')).rejects.toThrow(NotFoundError);
    });
  });
});
