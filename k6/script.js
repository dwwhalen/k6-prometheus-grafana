import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const myCounter = new Counter('my_counter');
export const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  const baseUrl = 'http://sample-api:3000';

  // Test GET endpoint
  let getResponse = http.get(`${baseUrl}/api/users/${Math.floor(Math.random() * 100)}`);
  check(getResponse, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Track custom metrics
  errorRate.add(getResponse.status !== 200);
  responseTime.add(getResponse.timings.duration);
  myCounter.add(1);

  sleep(1);

  // Test POST endpoint
  let postResponse = http.post(`${baseUrl}/api/users`, JSON.stringify({
    name: `TestUser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(postResponse, {
    'POST status is 201': (r) => r.status === 201,
    'POST response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(postResponse.status !== 201);
  myCounter.add(1);

  sleep(1);
}