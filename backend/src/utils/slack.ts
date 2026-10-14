import axios from 'axios';

export async function sendSlackMessage(webhookUrl: string, message: string) {
  try {
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error('Failed to send Slack message:', error);
  }
}

export async function sendSlackChatMessage(accessToken: string, channelId: string, message: string) {
  try {
    await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channelId,
      text: message,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to send Slack chat message:', error);
  }
}
