import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDoctor extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  specialisation: string;
  licenseNumber: string;
  contactNumber: string;
  bio?: string;
  consultationFee: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    specialisation: { type: String, required: true, index: true },
    licenseNumber: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    bio: { type: String },
    consultationFee: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);
