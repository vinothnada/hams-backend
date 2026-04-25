import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClinicalNote {
  doctorId: Types.ObjectId;
  note: string;
  createdAt: Date;
}

export interface IEHRRecord extends Document {
  patientId: Types.ObjectId;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  clinicalNotes: IClinicalNote[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clinicalNoteSchema = new Schema<IClinicalNote>({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ehrSchema = new Schema<IEHRRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    clinicalNotes: { type: [clinicalNoteSchema], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EHR = mongoose.model<IEHRRecord>('EHR', ehrSchema);
