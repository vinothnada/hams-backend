import mongoose from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { TimeSlot } from '../models/TimeSlot';
import { UserRole } from '../models/User';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';

interface CreateAppointmentDto {
  slotId: string;
  doctorId: string;
  type?: string;
  notes?: string;
}

interface UpdateDto {
  status: AppointmentStatus;
  cancelReason?: string;
}

export class AppointmentService {
  async createAppointment(patientUserId: string, data: CreateAppointmentDto): Promise<IAppointment> {
    const patient = await Patient.findOne({ userId: patientUserId });
    if (!patient) throw new NotFoundError('Patient profile');

    const slot = await TimeSlot.findById(data.slotId);
    if (!slot) throw new NotFoundError('TimeSlot');
    if (!slot.isAvailable) throw new ConflictError('Slot no longer available');

    let appointmentId: string;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [appointment] = await Appointment.create(
        [
          {
            patientId: patient._id,
            doctorId: data.doctorId,
            slotId: data.slotId,
            type: data.type ?? 'IN_PERSON',
            notes: data.notes,
          },
        ],
        { session }
      );
      appointmentId = (appointment._id as object).toString();

      slot.isAvailable = false;
      await slot.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return Appointment.findById(appointmentId).populate('slotId').populate('doctorId') as Promise<IAppointment>;
  }

  async getPatientAppointments(
    patientUserId: string,
    status?: string
  ): Promise<IAppointment[]> {
    const patient = await Patient.findOne({ userId: patientUserId });
    if (!patient) throw new NotFoundError('Patient profile');

    const query: Record<string, unknown> = { patientId: patient._id };
    if (status) query['status'] = status;

    return Appointment.find(query)
      .populate('doctorId', 'firstName lastName specialisation')
      .populate('slotId')
      .sort({ createdAt: -1 });
  }

  async getDoctorAppointments(
    doctorUserId: string,
    status?: string
  ): Promise<IAppointment[]> {
    const doctor = await Doctor.findOne({ userId: doctorUserId });
    if (!doctor) throw new NotFoundError('Doctor profile');

    const query: Record<string, unknown> = { doctorId: doctor._id };
    if (status) query['status'] = status;

    return Appointment.find(query)
      .populate('patientId', 'firstName lastName contactNumber')
      .populate('slotId')
      .sort({ createdAt: -1 });
  }

  async updateAppointmentStatus(
    appointmentId: string,
    userId: string,
    role: UserRole,
    dto: UpdateDto
  ): Promise<IAppointment> {
    const appointment = await Appointment.findById(appointmentId).populate('slotId');
    if (!appointment) throw new NotFoundError('Appointment');

    if (role === UserRole.PATIENT) {
      const patient = await Patient.findOne({ userId });
      if (!patient || patient._id.toString() !== appointment.patientId.toString()) {
        throw new ForbiddenError('Cannot modify this appointment');
      }
      if (dto.status !== AppointmentStatus.CANCELLED) {
        throw new ForbiddenError('Patients can only cancel appointments');
      }
    } else if (role === UserRole.DOCTOR) {
      const { doctorService } = await import('./doctorService');
      const doctor = await doctorService.getDoctorByUserId(userId);
      if (doctor._id.toString() !== appointment.doctorId.toString()) {
        throw new ForbiddenError('Cannot modify this appointment');
      }
      if (
        dto.status !== AppointmentStatus.CONFIRMED &&
        dto.status !== AppointmentStatus.COMPLETED
      ) {
        throw new ForbiddenError('Doctors can only confirm or complete appointments');
      }
    }

    if (dto.status === AppointmentStatus.CANCELLED) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        appointment.status = dto.status;
        if (dto.cancelReason) appointment.cancelReason = dto.cancelReason;
        await appointment.save({ session });

        await TimeSlot.findByIdAndUpdate(
          appointment.slotId,
          { isAvailable: true },
          { session }
        );

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      appointment.status = dto.status;
      if (dto.cancelReason) appointment.cancelReason = dto.cancelReason;
      await appointment.save();
    }

    return appointment;
  }

  async getAppointmentById(id: string): Promise<IAppointment> {
    const appointment = await Appointment.findById(id)
      .populate('patientId')
      .populate('doctorId')
      .populate('slotId');
    if (!appointment) throw new NotFoundError('Appointment');
    return appointment;
  }
}

export const appointmentService = new AppointmentService();
