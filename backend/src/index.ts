/// <reference path="./types/express.d.ts" />
import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from './config';
import prisma from './config/prisma';
import { initEmailIndex } from './utils/elasticsearch';
import { requireAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import slackRoutes from './routes/slack';
import { emailQueue } from './queues/emailQueue';

// Passport Google OAuth
import Strategy from 'passport-google-oauth20';

passport.use(
  new Strategy.Strategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

const app = express();

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/api/emails', requireAuth as any, emailRoutes);
app.use('/api/slack', requireAuth as any, slackRoutes);

// Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) as any],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Reconcile function on startup
async function reconcileJobs() {
  console.log('Reconciling jobs...');
  
  // Reset stale PROCESSING emails to SCHEDULED
  const stale = await prisma.email.updateMany({
    where: { status: 'PROCESSING' },
    data: { status: 'SCHEDULED' },
  });
  console.log(`Reset ${stale.count} stale PROCESSING emails`);

  // Re-add SCHEDULED emails to queue
  const scheduledEmails = await prisma.email.findMany({
    where: { status: 'SCHEDULED' },
  });

  const jobs = scheduledEmails.map((email) => ({
    name: 'send-email',
    data: { emailId: email.id },
    opts: {
      delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
      jobId: email.jobId,
    },
  }));

  if (jobs.length > 0) {
    await emailQueue.addBulk(jobs);
    console.log(`Re-added ${jobs.length} jobs to queue`);
  }
}

// Initialize
async function init() {
  await initEmailIndex();
  await reconcileJobs();
  
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}

init().catch(console.error);
