import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import prisma from '../config/prisma';
import { createTransporter } from '../utils/nodemailer';
import { indexEmail } from '../utils/elasticsearch';
import { notifySlackHourlyLimit } from '../services/slackService';
import { config } from '../config';
import * as nodemailer from 'nodemailer';

const worker = new Worker(
  'emails',
  async (job: Job) => {
    const { emailId } = job.data;
    console.log(`Processing email ${emailId}`);

    // Idempotency check: atomically update status
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { sender: true, user: true },
    });

    if (!email) {
      console.log(`Email ${emailId} not found`);
      return;
    }

    if (email.status === 'SENT') {
      console.log(`Email ${emailId} already sent`);
      return;
    }

    // Atomic update to PROCESSING
    const updated = await prisma.email.updateMany({
      where: { id: emailId, status: 'SCHEDULED' },
      data: { status: 'PROCESSING' },
    });

    if (updated.count === 0) {
      console.log(`Email ${emailId} not in SCHEDULED state, skipping`);
      return;
    }

    // Per-sender hourly rate limit
    const now = new Date();
    const hourKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}`;
    const rateLimitKey = `rl:${email.senderId}:${hourKey}`;

    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 3700);
    }

    if (currentCount > config.MAX_EMAILS_PER_HOUR_PER_SENDER) {
      // Decrement since we're not sending
      await redis.decr(rateLimitKey);

      // Reset status to SCHEDULED
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'SCHEDULED' },
      });

      // Calculate next hour start
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const nextHourStr = nextHour.toLocaleTimeString();
      const jitter = Math.random() * 1000; // Small jitter
      const delayUntil = nextHour.getTime() + jitter;

      // Move job to delayed
      await job.moveToDelayed(delayUntil, job.token);

      // Slack notification (once per sender+hour)
      const notifKey = `slacknotif:${email.senderId}:${hourKey}`;
      const notifSent = await redis.set(notifKey, '1', 'EX', 3600, 'NX') as 'OK' | null;
      if (notifSent === 'OK') {
        await notifySlackHourlyLimit(email.userId, email.senderId, currentCount, nextHourStr);
      }

      throw new Error(`Rate limit exceeded for sender ${email.senderId}, rescheduled to ${nextHourStr}`);
    }

    // Send email
    try {
      const transporter = createTransporter(
        email.sender.etherealUser,
        email.sender.etherealPass,
        email.sender.etherealHost,
        email.sender.etherealPort
      );

      const info = await transporter.sendMail({
        from: email.sender.etherealUser,
        to: email.toEmail,
        subject: email.subject,
        text: email.body,
      });

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          etherealPreviewUrl: nodemailer.getTestMessageUrl(info) || null,
        },
      });

      const updatedEmail = await prisma.email.findUnique({ where: { id: emailId } });
      if (updatedEmail) {
        await indexEmail(updatedEmail);
      }
      console.log(`Email ${emailId} sent successfully`);
    } catch (error) {
      console.error(`Failed to send email ${emailId}:`, error);
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: config.WORKER_CONCURRENCY,
    limiter: {
      max: 1,
      duration: config.MIN_DELAY_MS,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

export default worker;
