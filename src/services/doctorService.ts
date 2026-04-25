import { Doctor, IDoctor } from '../models/Doctor';
import { TimeSlot, ITimeSlot } from '../models/TimeSlot';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment';
import { NotFoundError, ConflictError } from '../utils/errors';
import { isSameDay } from '../utils/dateUtils';

interface SlotDto {
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}

interface DoctorFilters {
  specialisation?: string;
  isAvailable?: boolean;
}

export class DoctorService {
  async getAllDoctors(filters: DoctorFilters): Promise<IDoctor[]> {
    const query: Record<string, unknown> = {};
    if (filters.specialisation) query['specialisation'] = filters.specialisation;
    if (filters.isAvailable !== undefined) query['isAvailable'] = filters.isAvailable;

    return Doctor.find(query).populate('userId', 'email').sort('firstName');
  }

  async getDoctorById(doctorId: string): Promise<IDoctor> {
    const doctor = await Doctor.findById(doctorId).populate('userId', 'email');
    if (!doctor) throw new NotFoundError('Doctor');
    return doctor;
  }

  async getDoctorByUserId(userId: string): Promise<IDoctor> {
    const doctor = await Doctor.findOne({ userId }).populate('userId', 'email');
    if (!doctor) throw new NotFoundError('Doctor profile');
    return doctor;
  }

  async setAvailability(doctorId: string, slots: SlotDto[]): Promise<ITimeSlot[]> {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new NotFoundError('Doctor');

    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = { start: new Date(slots[i].startTime), end: new Date(slots[i].endTime) };
        const b = { start: new Date(slots[j].startTime), end: new Date(slots[j].endTime) };
        if (isSameDay(a.start, b.start) && a.start < b.end && b.start < a.end) {
          throw new ConflictError('Slot time overlap detected');
        }
      }
    }

    const docs = slots.map((s) => ({
      doctorId,
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
      durationMinutes: s.durationMinutes ?? 30,
      isAvailable: true,
    }));

    const inserted = await TimeSlot.insertMany(docs);
    return inserted as unknown as ITimeSlot[];
  }

  async getSchedule(doctorId: string): Promise<IAppointment[]> {
    return Appointment.find({
      doctorId,
      status: { $ne: AppointmentStatus.CANCELLED },
    })
      .populate('patientId', 'firstName lastName contactNumber')
      .populate('slotId')
      .sort({ 'slotId.startTime': 1 });
  }
}

export const doctorService = new DoctorService();
