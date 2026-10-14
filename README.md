# Email Job Scheduler

Full-stack email scheduling system with BullMQ, Redis, PostgreSQL, Elasticsearch, and Slack integration.

## Architecture

- **Scheduling**: BullMQ delayed jobs with deterministic jobIds for idempotency
- **Rate Limiting**: Redis-based per-sender hourly counters with automatic next-hour rescheduling
- **Persistence**: PostgreSQL (Prisma) as source of truth, Redis for job queue
- **Restart Recovery**: Reconcile function re-adds SCHEDULED/PROCESSING emails missing from queue on startup
- **Concurrency**: Configurable worker concurrency with min delay (default 2s) between sends
- **Search**: Elasticsearch indexing on email create and status update

## Features

- Google OAuth authentication
- Schedule bulk emails with CSV/txt recipient upload
- Round-robin sender distribution (3 Ethereal senders per user)
- Per-sender hourly rate limiting (default 50/hour)
- Slack OAuth integration for rate limit notifications
- Real-time email status tracking
- Elasticsearch-powered search
- Bull Board dashboard at `/admin/queues`
- Dark/light theme toggle

## Run Steps

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
cp ../.env.example .env
# Edit .env with your Google/Slack OAuth credentials
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

In another terminal:
```bash
npm run worker
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Bull Board: http://localhost:5000/admin/queues

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
4. Copy Client ID and Secret to `.env`

### Slack OAuth

1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app with OAuth & Permissions
3. Add scopes: `chat:write`, `incoming-webhook`
4. Add redirect URI: `http://localhost:5000/api/slack/callback`
5. Copy Client ID and Secret to `.env`

## Load Test

```bash
cd backend
npm run load-test
```

This schedules 1000 test emails to demonstrate bulk scheduling.

### Verification Commands

```bash
# Backend verification
cd backend
npx ts-node scripts/verifyBackend.ts

# Frontend build verification
cd frontend
npm run build

# Load test (requires manual login first)
cd backend
npm run load-test
```

## Assumptions & Trade-offs

- Ethereal SMTP used for demo (replace with real SMTP in production)
- Session-based auth (JWT could be added for API-only access)
- Single-node Elasticsearch (cluster for production)
- No cron jobs - all scheduling via BullMQ delayed jobs
- Rate limit notifications sent once per sender+hour to avoid spam
