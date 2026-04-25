export const createPatientUserFixture = (): object => ({
  email: `patient_${Date.now()}@test.com`,
  password: 'Patient@123',
  role: 'PATIENT',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  contactNumber: '+1234567890',
});

export const createDoctorUserFixture = (): object => ({
  email: `doctor_${Date.now()}@test.com`,
  password: 'Doctor@123',
  role: 'DOCTOR',
  firstName: 'Jane',
  lastName: 'Smith',
  contactNumber: '+1987654321',
  specialisation: 'Cardiology',
  licenseNumber: `LIC-${Date.now()}`,
  consultationFee: 150,
});

export const createSlotFixture = (doctorId: string): object => ({
  doctorId,
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
  durationMinutes: 30,
  isAvailable: true,
});

export const createAppointmentFixture = (
  patientId: string,
  doctorId: string,
  slotId: string
): object => ({
  patientId,
  doctorId,
  slotId,
  type: 'IN_PERSON',
});
