import { EHRService } from '../../../src/services/ehrService';
import { NotFoundError, ForbiddenError } from '../../../src/utils/errors';
import { UserRole } from '../../../src/models/User';

jest.mock('../../../src/models/EHR');
jest.mock('../../../src/models/Patient');
jest.mock('../../../src/models/Doctor');

const { EHR } = jest.requireMock('../../../src/models/EHR');
const { Patient } = jest.requireMock('../../../src/models/Patient');
const { Doctor } = jest.requireMock('../../../src/models/Doctor');

describe('EHRService', () => {
  let service: EHRService;

  beforeEach(() => {
    service = new EHRService();
    jest.clearAllMocks();
  });

  describe('getEHRByPatientId()', () => {
    const mockEHR = { _id: 'ehr1', patientId: 'patient1', clinicalNotes: [] };

    it('patient can access own EHR', async () => {
      Patient.findById.mockResolvedValue({ _id: 'patient1', userId: { toString: () => 'user1' } });
      EHR.findOne.mockResolvedValue(mockEHR);

      const result = await service.getEHRByPatientId('patient1', 'user1', UserRole.PATIENT);
      expect(result).toEqual(mockEHR);
    });

    it('doctor can access any patient EHR', async () => {
      EHR.findOne.mockResolvedValue(mockEHR);
      const result = await service.getEHRByPatientId('patient1', 'docUser1', UserRole.DOCTOR);
      expect(result).toEqual(mockEHR);
    });

    it('throws ForbiddenError when patient accesses another patient EHR', async () => {
      Patient.findById.mockResolvedValue({ _id: 'patient1', userId: { toString: () => 'otherUser' } });

      await expect(
        service.getEHRByPatientId('patient1', 'user1', UserRole.PATIENT)
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError for missing EHR', async () => {
      EHR.findOne.mockResolvedValue(null);
      await expect(
        service.getEHRByPatientId('patient1', 'docUser1', UserRole.DOCTOR)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('addClinicalNote()', () => {
    const mockDoctor = { _id: 'doc1' };
    const mockEHR = {
      _id: 'ehr1',
      patientId: 'patient1',
      clinicalNotes: [],
      lastUpdated: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    it('appends note to clinicalNotes array', async () => {
      Doctor.findOne.mockResolvedValue(mockDoctor);
      EHR.findOne.mockResolvedValue(mockEHR);

      await service.addClinicalNote('patient1', 'docUser1', 'Patient shows improvement');
      expect(mockEHR.clinicalNotes).toHaveLength(1);
      expect(mockEHR.save).toHaveBeenCalled();
    });

    it('updates lastUpdated timestamp', async () => {
      const before = new Date();
      Doctor.findOne.mockResolvedValue(mockDoctor);
      mockEHR.clinicalNotes = [];
      EHR.findOne.mockResolvedValue(mockEHR);

      await service.addClinicalNote('patient1', 'docUser1', 'Follow-up required');
      expect(mockEHR.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('throws NotFoundError when doctor not found', async () => {
      Doctor.findOne.mockResolvedValue(null);
      await expect(
        service.addClinicalNote('patient1', 'noDoctor', 'Note')
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when EHR not found', async () => {
      Doctor.findOne.mockResolvedValue(mockDoctor);
      EHR.findOne.mockResolvedValue(null);
      await expect(
        service.addClinicalNote('patient1', 'docUser1', 'Some note here')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateEHR()', () => {
    it('updates and returns the EHR', async () => {
      const updated = { _id: 'ehr1', allergies: ['Peanuts'] };
      EHR.findOneAndUpdate.mockResolvedValue(updated);
      const result = await service.updateEHR('patient1', { allergies: ['Peanuts'] });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundError when EHR not found', async () => {
      EHR.findOneAndUpdate.mockResolvedValue(null);
      await expect(service.updateEHR('patient1', {})).rejects.toThrow(NotFoundError);
    });
  });
});
