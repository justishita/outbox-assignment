import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function loadTest() {
  console.log('Starting load test...');
  
  // First, login via browser to get session cookie
  console.log('Please login at http://localhost:3000 and press Enter when ready');
  await new Promise(resolve => process.stdin.once('data', resolve));

  // Generate 1000 test emails
  const recipients = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
  
  const startTime = new Date(Date.now() + 60000); // 1 minute from now
  
  try {
    const response = await axios.post(`${API_URL}/api/emails/schedule`, {
      subject: 'Load Test Email',
      body: 'This is a test email for load testing the email scheduler.',
      recipients,
      startTime: startTime.toISOString(),
      delayBetweenMs: 2000,
      hourlyLimit: 50,
    }, {
      withCredentials: true,
    });
    
    console.log(`Scheduled ${response.data.count} emails successfully`);
    console.log('Check http://localhost:5000/admin/queues to view job queue');
    console.log('Check http://localhost:3000/dashboard to view scheduled emails');
  } catch (error) {
    console.error('Load test failed:', error);
  }
}

loadTest();
