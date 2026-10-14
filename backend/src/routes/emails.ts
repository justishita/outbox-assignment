/// <reference path="../types/express.d.ts" />
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scheduleEmails, paginatedEmails } from '../services/emailService';
import { searchEmails } from '../utils/elasticsearch';
import prisma from '../config/prisma';

const router = Router() as any;

const scheduleSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()),
  startTime: z.string(),
  delayBetweenMs: z.number().min(1000),
  hourlyLimit: z.number().min(1),
});

router.post('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = scheduleSchema.parse(req.body);
    const startTime = new Date(data.startTime);

    const { count, emails } = await scheduleEmails(
      req.user!.id,
      data.subject,
      data.body,
      data.recipients,
      startTime,
      data.delayBetweenMs,
      data.hourlyLimit
    );

    // Add jobs to queue
    const { emailQueue } = await import('../queues/emailQueue');
    const jobs = emails.map((email, index) => ({
      name: 'send-email',
      data: { emailId: email.id },
      opts: {
        delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
        jobId: email.jobId,
      },
    }));
    await emailQueue.addBulk(jobs);

    // Index emails in Elasticsearch
    const { indexEmail } = await import('../utils/elasticsearch');
    for (const email of emails) {
      await indexEmail(email);
    }

    res.json({ count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Failed to schedule emails' });
  }
});

router.get('/scheduled', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await paginatedEmails(req.user!.id, 'SCHEDULED', page);
  res.json(result);
});

router.get('/sent', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await paginatedEmails(req.user!.id, 'SENT', page);
  res.json(result);
});

router.get('/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    return res.status(400).json({ error: 'Query required' });
  }
  const page = parseInt(req.query.page as string) || 1;
  const from = (page - 1) * 20;
  const results = await searchEmails(req.user!.id, q, from, 20);
  res.json({ emails: results, page });
});

export default router;
