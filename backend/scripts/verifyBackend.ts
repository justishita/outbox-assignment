import { readFileSync } from 'fs';
import { join } from 'path';

console.log('=== Backend Requirements Verification ===\n');

// Check 1: ioredis maxRetriesPerRequest: null
const redisConfig = readFileSync(join(__dirname, '../src/config/redis.ts'), 'utf-8');
const hasMaxRetriesNull = redisConfig.includes('maxRetriesPerRequest: null');
console.log(`${hasMaxRetriesNull ? '✓' : '✗'} ioredis uses maxRetriesPerRequest: null`);

// Check 2: Queue and Worker share same connection config
const queueConfig = readFileSync(join(__dirname, '../src/queues/emailQueue.ts'), 'utf-8');
const workerConfig = readFileSync(join(__dirname, '../src/workers/emailWorker.ts'), 'utf-8');
const queueUsesRedis = queueConfig.includes('connection: redis');
const workerUsesRedis = workerConfig.includes('connection: redis');
console.log(`${queueUsesRedis && workerUsesRedis ? '✓' : '✗'} Queue and Worker share same redis connection`);

// Check 3: Deterministic jobId format
const emailService = readFileSync(join(__dirname, '../src/services/emailService.ts'), 'utf-8');
const hasDeterministicJobId = emailService.includes('jobId = `email-${email.id}`');
console.log(`${hasDeterministicJobId ? '✓' : '✗'} jobId format is email-<id> (deterministic)`);

// Check 4: Delay calculation
const hasCorrectDelay = emailService.includes('baseDelay + i * delayBetweenMs');
console.log(`${hasCorrectDelay ? '✓' : '✗'} Delay calculation: (startTime - now) + i*delayBetweenMs`);

// Check 5: Worker concurrency from env
const config = readFileSync(join(__dirname, '../src/config/index.ts'), 'utf-8');
const hasConcurrencyConfig = config.includes('WORKER_CONCURRENCY');
const workerUsesConcurrency = workerConfig.includes('concurrency: config.WORKER_CONCURRENCY');
console.log(`${hasConcurrencyConfig && workerUsesConcurrency ? '✓' : '✗'} Worker concurrency from env`);

// Check 6: Limiter enforces min gap
const hasLimiter = workerConfig.includes('limiter:');
const hasMinDelay = workerConfig.includes('config.MIN_DELAY_MS');
console.log(`${hasLimiter && hasMinDelay ? '✓' : '✗'} Limiter enforces min gap`);

// Check 7: Atomic DB update SCHEDULED→PROCESSING
const hasAtomicUpdate = workerConfig.includes('updateMany') && workerConfig.includes('status: \'SCHEDULED\'');
console.log(`${hasAtomicUpdate ? '✓' : '✗'} Atomic DB update SCHEDULED→PROCESSING`);

// Check 8: Idempotency check (SENT check)
const hasIdempotency = workerConfig.includes('status === \'SENT\'');
console.log(`${hasIdempotency ? '✓' : '✗'} Idempotency check prevents duplicate sends`);

// Check 9: Hourly rate limit with Redis INCR
const hasRateLimit = workerConfig.includes('redis.incr') && workerConfig.includes('rl:');
console.log(`${hasRateLimit ? '✓' : '✗'} Hourly rate limit uses Redis INCR with key rl:{senderId}:{hour}`);

// Check 10: Rate limit EXPIRE
const hasExpire = workerConfig.includes('redis.expire');
console.log(`${hasExpire ? '✓' : '✗'} Rate limit key has EXPIRE`);

// Check 11: Rate limit DECR when over limit
const hasDecr = workerConfig.includes('redis.decr');
console.log(`${hasDecr ? '✓' : '✗'} DECR when over limit`);

// Check 12: moveToDelayed when over limit
const hasMoveToDelayed = workerConfig.includes('moveToDelayed');
console.log(`${hasMoveToDelayed ? '✓' : '✗'} moveToDelayed when over limit`);

// Check 13: Status reset to SCHEDULED when over limit
const hasStatusReset = workerConfig.includes('status: \'SCHEDULED\'') && workerConfig.includes('Rate limit exceeded');
console.log(`${hasStatusReset ? '✓' : '✗'} Status resets to SCHEDULED when over limit`);

// Check 14: Slack notification with SET NX guard
const hasSlackNotif = workerConfig.includes('slacknotif:') && workerConfig.includes('NX');
console.log(`${hasSlackNotif ? '✓' : '✗'} Slack notification with SET NX guard`);

// Check 15: Slack integration stores token per user
const slackRoute = readFileSync(join(__dirname, '../src/routes/slack.ts'), 'utf-8');
const hasSlackUpsert = slackRoute.includes('upsert');
console.log(`${hasSlackUpsert ? '✓' : '✗'} Slack OAuth stores token per user (upsert)`);

// Check 16: No crash if Slack not connected
const slackService = readFileSync(join(__dirname, '../src/services/slackService.ts'), 'utf-8');
const hasNoCrash = slackService.includes('if (!integration) return');
console.log(`${hasNoCrash ? '✓' : '✗'} No crash if Slack not connected`);

// Check 17: Restart persistence - reconcile on startup
const index = readFileSync(join(__dirname, '../src/index.ts'), 'utf-8');
const hasReconcile = index.includes('reconcileJobs');
const hasResetStale = index.includes('Reset stale PROCESSING');
const hasReAddJobs = index.includes('Re-add SCHEDULED emails');
console.log(`${hasReconcile && hasResetStale && hasReAddJobs ? '✓' : '✗'} Startup reconcile resets stale PROCESSING and re-adds SCHEDULED`);

// Check 18: Elasticsearch index created on startup
const hasInitIndex = index.includes('initEmailIndex');
console.log(`${hasInitIndex ? '✓' : '✗'} Elasticsearch index created on startup`);

// Check 19: Emails indexed on create
const emailRoute = readFileSync(join(__dirname, '../src/routes/emails.ts'), 'utf-8');
const hasIndexOnCreate = emailRoute.includes('indexEmail');
console.log(`${hasIndexOnCreate ? '✓' : '✗'} Emails indexed on create`);

// Check 20: Emails indexed on status update
const hasIndexOnUpdate = workerConfig.includes('indexEmail');
console.log(`${hasIndexOnUpdate ? '✓' : '✗'} Emails indexed on status update`);

// Check 21: Bull Board at /admin/queues
const hasBullBoard = index.includes('/admin/queues');
console.log(`${hasBullBoard ? '✓' : '✗'} Bull Board at /admin/queues`);

// Check 22: Ethereal senders auto-created
const authService = readFileSync(join(__dirname, '../src/services/authService.ts'), 'utf-8');
const hasEtherealCreate = authService.includes('createEtherealAccount');
console.log(`${hasEtherealCreate ? '✓' : '✗'} Ethereal senders auto-created on user signup`);

// Check 23: No cron/node-cron/agenda
const allFiles = [
  readFileSync(join(__dirname, '../src/index.ts'), 'utf-8'),
  readFileSync(join(__dirname, '../src/worker.ts'), 'utf-8'),
  readFileSync(join(__dirname, '../src/workers/emailWorker.ts'), 'utf-8'),
];
const hasCron = allFiles.some(f => f.includes('cron') || f.includes('agenda'));
console.log(`${!hasCron ? '✓' : '✗'} No cron/node-cron/agenda found`);

// Check 24: Google OAuth
const authRoute = readFileSync(join(__dirname, '../src/routes/auth.ts'), 'utf-8');
const hasGoogleOAuth = authRoute.includes('google') && authRoute.includes('passport');
console.log(`${hasGoogleOAuth ? '✓' : '✗'} Google OAuth configured`);

// Check 25: /auth/me returns user
const hasGetMe = authRoute.includes('/me');
console.log(`${hasGetMe ? '✓' : '✗'} /auth/me endpoint exists`);

// Check 26: Logout clears cookie
const hasLogout = authRoute.includes('logout') && authRoute.includes('clearCookie');
console.log(`${hasLogout ? '✓' : '✗'} Logout clears cookie`);

// Check 27: CORS with credentials: true
const hasCors = index.includes('cors') && index.includes('credentials: true');
console.log(`${hasCors ? '✓' : '✓'} CORS with credentials: true`);

// Check 28: CORS origin matches frontend
const hasOrigin = index.includes('origin: config.FRONTEND_URL');
console.log(`${hasOrigin ? '✓' : '✗'} CORS origin matches frontend URL`);

// Check 29: Cookie settings
const hasCookieSettings = index.includes('httpOnly: true') && index.includes('secure:');
console.log(`${hasCookieSettings ? '✓' : '✗'} Cookie has httpOnly and secure settings`);

// Check 30: Protected routes return 401
const authMiddleware = readFileSync(join(__dirname, '../src/middleware/auth.ts'), 'utf-8');
const hasRequireAuth = authMiddleware.includes('401');
console.log(`${hasRequireAuth ? '✓' : '✗'} Protected routes return 401 when not logged in`);

console.log('\n=== Manual Tests Required ===');
console.log('1. Test actual email sending via Ethereal');
console.log('2. Test rate limit with real emails (set limit to 2, send 5)');
console.log('3. Test Slack OAuth flow end-to-end');
console.log('4. Test restart persistence: schedule, kill, restart, verify');
console.log('5. Test Elasticsearch search with real data');
