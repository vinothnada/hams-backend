import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb';
import { createPatientUserFixture, createDoctorUserFixture } from '../helpers/fixtures';
import { Patient } from '../../src/models/Patient';

beforeAll(() => connectTestDb());
afterEach(() => clearTestDb());
afterAll(() => closeTestDb());

const registerAndLogin = async (fixture: object): Promise<{ token: string; userId: string }> => {
  const res = await request(app).post('/api/v1/auth/register').send(fixture);
  return { token: res.body.data.token, userId: res.body.data.user._id };
};

describe('GET /api/v1/ehr/my', () => {
  it('200 — patient retrieves own EHR', async () => {
    const { token } = await registerAndLogin(createPatientUserFixture());
    const res = await request(app)
      .get('/api/v1/ehr/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/v1/ehr/my');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/ehr/:patientId', () => {
  it('200 — doctor retrieves patient EHR', async () => {
    const { token: patientToken, userId: patientUserId } = await registerAndLogin(createPatientUserFixture());
    const { token: doctorToken } = await registerAndLogin(createDoctorUserFixture());

    const patient = await Patient.findOne({ userId: patientUserId });
    const patientId = (patient!._id as object).toString();

    const res = await request(app)
      .get(`/api/v1/ehr/${patientId}`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);

    void patientToken;
  });

  it('403 — patient cannot retrieve another patient EHR', async () => {
    const { userId: patientUserId } = await registerAndLogin(createPatientUserFixture());
    const { token: patient2Token } = await registerAndLogin(createPatientUserFixture());

    const patient = await Patient.findOne({ userId: patientUserId });
    const patientId = (patient!._id as object).toString();

    const res = await request(app)
      .get(`/api/v1/ehr/${patientId}`)
      .set('Authorization', `Bearer ${patient2Token}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/ehr/:patientId/notes', () => {
  it('200 — doctor adds clinical note', async () => {
    const { userId: patientUserId } = await registerAndLogin(createPatientUserFixture());
    const { token: doctorToken } = await registerAndLogin(createDoctorUserFixture());

    const patient = await Patient.findOne({ userId: patientUserId });
    const patientId = (patient!._id as object).toString();

    const res = await request(app)
      .post(`/api/v1/ehr/${patientId}/notes`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ note: 'Patient shows significant improvement in vitals' });
    expect(res.status).toBe(200);
  });

  it('403 — patient cannot add clinical note', async () => {
    const { token: patientToken, userId: patientUserId } = await registerAndLogin(createPatientUserFixture());
    const patient = await Patient.findOne({ userId: patientUserId });
    const patientId = (patient!._id as object).toString();

    const res = await request(app)
      .post(`/api/v1/ehr/${patientId}/notes`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ note: 'Self-prescribed note' });
    expect(res.status).toBe(403);
  });

  it('422 — note too short (< 10 chars)', async () => {
    const { userId: patientUserId } = await registerAndLogin(createPatientUserFixture());
    const { token: doctorToken } = await registerAndLogin(createDoctorUserFixture());

    const patient = await Patient.findOne({ userId: patientUserId });
    const patientId = (patient!._id as object).toString();

    const res = await request(app)
      .post(`/api/v1/ehr/${patientId}/notes`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ note: 'Short' });
    expect(res.status).toBe(422);
  });
});
