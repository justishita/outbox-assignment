import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function testRequirements() {
  console.log('=== Testing Backend Requirements ===\n');

  // Test 1: Check Bull Board
  try {
    const res = await axios.get(`${API_URL}/admin/queues`);
    console.log('✓ Bull Board reachable at /admin/queues');
  } catch (error) {
    console.log('✗ Bull Board not reachable');
  }

  // Test 2: Check Elasticsearch index
  try {
    const res = await axios.get(`${API_URL}/api/emails/search?q=test`, {
      withCredentials: true,
    });
    console.log('✓ Elasticsearch search endpoint responds');
  } catch (error) {
    console.log('✗ Elasticsearch search failed (may need auth)');
  }

  // Test 3: Check auth/me without auth
  try {
    const res = await axios.get(`${API_URL}/auth/me`, {
      withCredentials: true,
    });
    console.log('✗ /auth/me should return 401 without auth');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✓ /auth/me returns 401 without auth');
    } else {
      console.log('✗ /auth/me unexpected error');
    }
  }

  console.log('\n=== Manual Tests Required ===');
  console.log('1. Login via Google OAuth at http://localhost:3000');
  console.log('2. Schedule emails via Compose modal');
  console.log('3. Check Bull Board at http://localhost:5000/admin/queues');
  console.log('4. Test rate limit by scheduling >50 emails/hour');
  console.log('5. Connect Slack and test notifications');
  console.log('6. Test restart persistence: schedule emails, kill server, restart');
}

testRequirements();
