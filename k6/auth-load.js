import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    errors: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const email = `loadtest_${__VU}_${__ITER}@test.com`;
  const body = JSON.stringify({
    email,
    password: 'Load@Test1',
    role: 'PATIENT',
    firstName: 'Load',
    lastName: 'Test',
    dateOfBirth: '1990-01-01',
    contactNumber: '+1234567890',
  });

  const reg = http.post(`${BASE}/api/v1/auth/register`, body, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(reg, { 'register 201': (r) => r.status === 201 });
  errorRate.add(reg.status !== 201);

  sleep(1);

  const login = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email, password: 'Load@Test1' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login 200': (r) => r.status === 200 });
  errorRate.add(login.status !== 200);

  sleep(Math.random() * 2);
}
