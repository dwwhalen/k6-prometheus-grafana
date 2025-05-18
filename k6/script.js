import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics - these allow us to track specific aspects of our test
export const errorRate = new Rate('errors');           // Tracks percentage of errors
export const myCounter = new Counter('my_counter');    // Simple incrementing counter
export const responseTime = new Trend('response_time'); // Tracks response time distribution

export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Ramp up to 5 virtual users over 30 seconds
    { duration: '90s', target: 20 }, // Ramp to from 5 to 20 virtual users over 90 seconds
    { duration: '3m', target: 20 }, // Stay at 20 virtual users for 3 minutes
    { duration: '30s', target: 0 },  // Gradually ramp down to 0 over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete in less than 500ms for the test to pass
    http_req_failed: ['rate<0.1'],    // Test fails if more than 10% of requests fail
  },
};

export default function () {
  const baseUrl = 'http://sample-api:3000';
  
  // Test GET endpoint - fetches a random user
  let getResponse = http.get(`${baseUrl}/api/users/${Math.floor(Math.random() * 100)}`);
  check(getResponse, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Track custom metrics for this request
  errorRate.add(getResponse.status !== 200);
  responseTime.add(getResponse.timings.duration);
  myCounter.add(1);
  
  sleep(1); // Pause for 1 second between requests
  
  // Test POST endpoint - creates a new user
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