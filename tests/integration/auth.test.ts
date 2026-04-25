import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../helpers/testDb';
import { createPatientUserFixture, createDoctorUserFixture } from '../helpers/fixtures';
import jwt from 'jsonwebtoken';

beforeAll(() => connectTestDb());
afterEach(() => clearTestDb());
afterAll(() => closeTestDb());

describe('POST /api/v1/auth/register', () => {
  it('201 — registers PATIENT with valid data', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(createPatientUserFixture());
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
  });

  it('201 — registers DOCTOR with valid data', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(createDoctorUserFixture());
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
  });

  it('409 — duplicate email', async () => {
    const body = createPatientUserFixture();
    await request(app).post('/api/v1/auth/register').send(body);
    const res = await request(app).post('/api/v1/auth/register').send(body);
    expect(res.status).toBe(409);
  });

  it('422 — missing password', async () => {
    const body = { ...createPatientUserFixture() } as Record<string, unknown>;
    delete body['password'];
    const res = await request(app).post('/api/v1/auth/register').send(body);
    expect(res.status).toBe(422);
  });

  it('422 — weak password (no special char)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...createPatientUserFixture(), password: 'Password1' });
    expect(res.status).toBe(422);
  });

  it('422 — missing specialisation for DOCTOR role', async () => {
    const body = { ...createDoctorUserFixture() } as Record<string, unknown>;
    delete body['specialisation'];
    const res = await request(app).post('/api/v1/auth/register').send(body);
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  const fixture = createPatientUserFixture() as Record<string, unknown>;

  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(fixture);
  });

  it('200 — returns token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: fixture['email'], password: fixture['password'] });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('401 — invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: fixture['email'], password: 'Wrong@123' });
    expect(res.status).toBe(401);
  });

  it('401 — unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'Pass@123' });
    expect(res.status).toBe(401);
  });

  it('422 — missing email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'Pass@123' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/auth/me', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/auth/register').send(createPatientUserFixture());
    token = res.body.data.token;
  });

  it('200 — returns user when authenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('userId');
  });

  it('401 — missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 — expired token', async () => {
    const expired = jwt.sign({ userId: 'x', email: 'x@x.com', role: 'PATIENT' }, 'wrong-secret', {
      expiresIn: '-1s',
    });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});
