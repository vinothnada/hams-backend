import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb';
import { createPatientUserFixture, createDoctorUserFixture } from '../helpers/fixtures';

beforeAll(() => connectTestDb());
afterEach(() => clearTestDb());
afterAll(() => closeTestDb());

const registerAndLogin = async (fixture: object): Promise<string> => {
  const res = await request(app).post('/api/v1/auth/register').send(fixture);
  return res.body.data.token;
};

const futureSlots = (): object => ({
  slots: [
    {
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      durationMinutes: 30,
    },
  ],
});

describe('GET /api/v1/doctors', () => {
  it('200 — returns list of doctors (public endpoint)', async () => {
    await request(app).post('/api/v1/auth/register').send(createDoctorUserFixture());
    const res = await request(app).get('/api/v1/doctors');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('200 — filters by specialisation', async () => {
    await request(app).post('/api/v1/auth/register').send(createDoctorUserFixture());
    const res = await request(app).get('/api/v1/doctors?specialisation=Cardiology');
    expect(res.status).toBe(200);
    expect(res.body.data.every((d: { specialisation: string }) => d.specialisation === 'Cardiology')).toBe(true);
  });
});

describe('POST /api/v1/doctors/availability', () => {
  let doctorToken: string;
  let patientToken: string;

  beforeEach(async () => {
    doctorToken = await registerAndLogin(createDoctorUserFixture());
    patientToken = await registerAndLogin(createPatientUserFixture());
  });

  it('201 — doctor sets availability slots', async () => {
    const res = await request(app)
      .post('/api/v1/doctors/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(futureSlots());
    expect(res.status).toBe(201);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).post('/api/v1/doctors/availability').send(futureSlots());
    expect(res.status).toBe(401);
  });

  it('403 — patient cannot set availability', async () => {
    const res = await request(app)
      .post('/api/v1/doctors/availability')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(futureSlots());
    expect(res.status).toBe(403);
  });

  it('422 — past date rejected', async () => {
    const res = await request(app)
      .post('/api/v1/doctors/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        slots: [
          {
            startTime: new Date(Date.now() - 86400000).toISOString(),
            endTime: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          },
        ],
      });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/doctors/schedule/my', () => {
  it('200 — returns doctor upcoming confirmed appointments', async () => {
    const doctorToken = await registerAndLogin(createDoctorUserFixture());
    const res = await request(app)
      .get('/api/v1/doctors/schedule/my')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
