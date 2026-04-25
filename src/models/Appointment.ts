import mongoose, { Document, Schema, Types } from 'mongoose';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  TELEMEDICINE = 'TELEMEDICINE',
}

export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  slotId: Types.ObjectId;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING,
    },
    type: {
      type: String,
      enum: Object.values(AppointmentType),
      default: AppointmentType.IN_PERSON,
    },
    notes: { type: String, maxlength: 500 },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
