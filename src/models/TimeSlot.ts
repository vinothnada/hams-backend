import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITimeSlot extends Document {
  doctorId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 15 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timeSlotSchema.index({ doctorId: 1, isAvailable: 1 });
timeSlotSchema.index({ startTime: 1 });

export const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot', timeSlotSchema);
