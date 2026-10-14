import prisma from '../config/prisma';
import { Email } from '@prisma/client';

export async function scheduleEmails(
  userId: string,
  subject: string,
  body: string,
  recipients: string[],
  startTime: Date,
  delayBetweenMs: number,
  hourlyLimit: number
): Promise<{ count: number; emails: Email[] }> {
  const senders = await prisma.sender.findMany({
    where: { userId },
  });

  if (senders.length === 0) {
    throw new Error('No senders available for this user');
  }

  const emails: Email[] = [];
  const now = new Date();
  const baseDelay = startTime.getTime() - now.getTime();

  for (let i = 0; i < recipients.length; i++) {
    const sender = senders[i % senders.length];
    const scheduledAt = new Date(now.getTime() + baseDelay + i * delayBetweenMs);

    const email = await prisma.email.create({
      data: {
        userId,
        senderId: sender.id,
        toEmail: recipients[i],
        subject,
        body,
        scheduledAt,
        jobId: '', // Will be set after creation
      },
    });

    // Set deterministic jobId based on email id
    const jobId = `email-${email.id}`;
    await prisma.email.update({
      where: { id: email.id },
      data: { jobId },
    });

    emails.push({ ...email, jobId });
  }

  return { count: emails.length, emails };
}

export async function paginatedEmails(
  userId: string,
  status: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where: { userId, status },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: limit,
      include: { sender: true },
    }),
    prisma.email.count({ where: { userId, status } }),
  ]);

  return { emails, total, page, limit };
};
