import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  ELASTICSEARCH_URL: z.string(),
  WORKER_CONCURRENCY: z.string().default('5'),
  MIN_DELAY_MS: z.string().default('2000'),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.string().default('50'),
  JWT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_CALLBACK_URL: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  DEV_LOGIN: z.string().default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  WORKER_CONCURRENCY: parseInt(parsed.data.WORKER_CONCURRENCY),
  MIN_DELAY_MS: parseInt(parsed.data.MIN_DELAY_MS),
  MAX_EMAILS_PER_HOUR_PER_SENDER: parseInt(parsed.data.MAX_EMAILS_PER_HOUR_PER_SENDER),
  PORT: parseInt(parsed.data.PORT),
  DEV_LOGIN: parsed.data.DEV_LOGIN === 'true',
};
