/// <reference path="../types/express.d.ts" />
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import prisma from '../config/prisma';
import { config } from '../config';

const router = Router() as any;

router.get('/connect', (req: Request, res: Response) => {
  const state = req.user!.id;
  const scope = 'chat:write,incoming-webhook';
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${config.SLACK_CLIENT_ID}&scope=${encodeURIComponent(scope)}&state=${state}&redirect_uri=${encodeURIComponent(config.SLACK_CALLBACK_URL)}`;
  res.redirect(authUrl);
});

router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(process.env.FRONTEND_URL + '/dashboard?error=missing_params');
  }

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', {
      client_id: config.SLACK_CLIENT_ID,
      client_secret: config.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: config.SLACK_CALLBACK_URL,
    });

    const data = response.data;
    if (!data.ok) {
      return res.redirect(process.env.FRONTEND_URL + '/dashboard?error=slack_auth_failed');
    }

    await prisma.slackIntegration.upsert({
      where: { userId: state as string },
      update: {
        accessToken: data.access_token,
        channelId: data.incoming_webhook?.channel_id,
        webhookUrl: data.incoming_webhook?.url,
        teamName: data.team?.name,
      },
      create: {
        userId: state as string,
        accessToken: data.access_token,
        channelId: data.incoming_webhook?.channel_id,
        webhookUrl: data.incoming_webhook?.url,
        teamName: data.team?.name,
      },
    });

    res.redirect(process.env.FRONTEND_URL + '/dashboard');
  } catch (error) {
    console.error('Slack callback error:', error);
    res.redirect(process.env.FRONTEND_URL + '/dashboard?error=slack_callback_error');
  }
});

router.get('/status', async (req: Request, res: Response) => {
  const integration = await prisma.slackIntegration.findUnique({
    where: { userId: req.user!.id },
    select: { teamName: true, channelId: true },
  });
  res.json({ connected: !!integration, teamName: integration?.teamName });
});

router.delete('/disconnect', async (req: Request, res: Response) => {
  await prisma.slackIntegration.delete({
    where: { userId: req.user!.id },
  });
  res.json({ success: true });
});

export default router;
