import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function testSchedule() {
  console.log('Testing POST /api/emails/schedule...\n');

  // First need to get a session cookie - this requires manual login
  console.log('NOTE: This test requires a valid session cookie.');
  console.log('Please login at http://localhost:3000 first, then run:');
  console.log('curl -X POST http://localhost:5000/api/emails/schedule \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \\');
  console.log('  -d \'{"subject":"Test","body":"Test body","recipients":["test@example.com"],"startTime":"2026-10-14T00:00:00.000Z","delayBetweenMs":2000,"hourlyLimit":50}\'');
}

testSchedule();
