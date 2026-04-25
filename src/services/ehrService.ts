import { EHR, IEHRRecord } from '../models/EHR';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { UserRole } from '../models/User';
import { NotFoundError, ForbiddenError } from '../utils/errors';

interface UpdateEHRDto {
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  bloodGroup?: string;
}

export class EHRService {
  async getEHRByPatientId(
    patientId: string,
    requestingUserId: string,
    requestingRole: UserRole
  ): Promise<IEHRRecord> {
    if (requestingRole === UserRole.PATIENT) {
      const patient = await Patient.findById(patientId);
      if (!patient || patient.userId.toString() !== requestingUserId) {
        throw new ForbiddenError('Cannot access this EHR');
      }
    }

    const ehr = await EHR.findOne({ patientId });
    if (!ehr) throw new NotFoundError('EHR');
    return ehr;
  }

  async updateEHR(patientId: string, dto: UpdateEHRDto): Promise<IEHRRecord> {
    const ehr = await EHR.findOneAndUpdate(
      { patientId },
      { ...dto, lastUpdated: new Date() },
      { new: true }
    );
    if (!ehr) throw new NotFoundError('EHR');
    return ehr;
  }

  async addClinicalNote(
    patientId: string,
    doctorUserId: string,
    note: string
  ): Promise<IEHRRecord> {
    const doctor = await Doctor.findOne({ userId: doctorUserId });
    if (!doctor) throw new NotFoundError('Doctor profile');

    const ehr = await EHR.findOne({ patientId });
    if (!ehr) throw new NotFoundError('EHR');

    ehr.clinicalNotes.push({ doctorId: doctor._id, note, createdAt: new Date() });
    ehr.lastUpdated = new Date();
    await ehr.save();
    return ehr;
  }
}

export const ehrService = new EHRService();
