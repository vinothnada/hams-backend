import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    errors: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const token = __ENV.TEST_TOKEN;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const slots = http.get(`${BASE}/api/v1/slots/suggest?specialisation=Cardiology`, { headers });
  check(slots, { 'slots 200': (r) => r.status === 200 });
  errorRate.add(slots.status !== 200);

  sleep(1);

  const body = JSON.stringify({
    slotId: __ENV.TEST_SLOT_ID,
    doctorId: __ENV.TEST_DOCTOR_ID,
    type: 'IN_PERSON',
  });
  const appt = http.post(`${BASE}/api/v1/appointments`, body, { headers });
  check(appt, { 'appt created or conflict': (r) => r.status === 201 || r.status === 409 });
  errorRate.add(appt.status >= 500);

  sleep(Math.random() * 2);
}
