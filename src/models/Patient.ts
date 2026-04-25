import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPatient extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  contactNumber: string;
  insuranceId?: string;
  address?: string;
  bloodGroup?: string;
  allergies: string[];
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    contactNumber: { type: String, required: true },
    insuranceId: { type: String },
    address: { type: String },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
