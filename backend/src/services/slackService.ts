import prisma from '../config/prisma';
import { sendSlackChatMessage, sendSlackMessage } from '../utils/slack';

export async function notifySlackHourlyLimit(userId: string, senderId: string, count: number, nextHour: string) {
  const integration = await prisma.slackIntegration.findUnique({
    where: { userId },
  });

  if (!integration) return;

  const message = `Sender ${senderId} hit hourly limit (${count}). Remaining emails rescheduled to ${nextHour}`;

  if (integration.webhookUrl) {
    await sendSlackMessage(integration.webhookUrl, message);
  } else if (integration.channelId && integration.accessToken) {
    await sendSlackChatMessage(integration.accessToken, integration.channelId, message);
  }
}
