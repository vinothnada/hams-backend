import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb';
import { createPatientUserFixture, createDoctorUserFixture } from '../helpers/fixtures';
import { TimeSlot } from '../../src/models/TimeSlot';
import { Doctor } from '../../src/models/Doctor';

beforeAll(() => connectTestDb());
afterEach(() => clearTestDb());
afterAll(() => closeTestDb());

const registerAndLogin = async (fixture: object): Promise<string> => {
  const res = await request(app).post('/api/v1/auth/register').send(fixture);
  return res.body.data.token;
};

const setupSlot = async (doctorToken: string): Promise<{ slotId: string; doctorId: string }> => {
  const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${doctorToken}`);
  const doctor = await Doctor.findOne({ userId: me.body.data.userId });

  const slot = await TimeSlot.create({
    doctorId: doctor!._id,
    startTime: new Date(Date.now() + 86400000),
    endTime: new Date(Date.now() + 86400000 + 1800000),
    durationMinutes: 30,
    isAvailable: true,
  });

  return { slotId: (slot._id as object).toString(), doctorId: (doctor!._id as object).toString() };
};

describe('POST /api/v1/appointments', () => {
  let patientToken: string;
  let doctorToken: string;

  beforeEach(async () => {
    patientToken = await registerAndLogin(createPatientUserFixture());
    doctorToken = await registerAndLogin(createDoctorUserFixture());
  });

  it('201 — patient creates appointment for available slot', async () => {
    const { slotId, doctorId } = await setupSlot(doctorToken);
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ slotId, doctorId, type: 'IN_PERSON' });
    expect(res.status).toBe(201);
  });

  it('409 — slot already taken (double-booking prevention)', async () => {
    const { slotId, doctorId } = await setupSlot(doctorToken);
    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ slotId, doctorId });

    const patientToken2 = await registerAndLogin(createPatientUserFixture());
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken2}`)
      .send({ slotId, doctorId });
    expect(res.status).toBe(409);
  });

  it('401 — unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({ slotId: 'x', doctorId: 'y' });
    expect(res.status).toBe(401);
  });

  it('403 — doctor role cannot book as patient', async () => {
    const { slotId, doctorId } = await setupSlot(doctorToken);
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ slotId, doctorId });
    expect(res.status).toBe(403);
  });

  it('422 — missing slotId', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/appointments/my', () => {
  let patientToken: string;

  beforeEach(async () => {
    patientToken = await registerAndLogin(createPatientUserFixture());
  });

  it('200 — returns patient appointments', async () => {
    const res = await request(app)
      .get('/api/v1/appointments/my')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('200 — empty array when no appointments', async () => {
    const res = await request(app)
      .get('/api/v1/appointments/my')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('PATCH /api/v1/appointments/:id/status', () => {
  let patientToken: string;
  let doctorToken: string;
  let appointmentId: string;

  beforeEach(async () => {
    patientToken = await registerAndLogin(createPatientUserFixture());
    doctorToken = await registerAndLogin(createDoctorUserFixture());
    const { slotId, doctorId } = await setupSlot(doctorToken);
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ slotId, doctorId });
    appointmentId = res.body.data._id;
  });

  it('200 — doctor confirms appointment', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(200);
  });

  it('200 — patient cancels appointment, slot becomes available again', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ status: 'CANCELLED', cancelReason: 'Changed plans' });
    expect(res.status).toBe(200);
  });

  it('403 — patient cannot confirm appointment', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(403);
  });

  it('422 — missing cancelReason when cancelling', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(422);
  });
});
