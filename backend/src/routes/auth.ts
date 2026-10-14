import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { findOrCreateUser } from '../services/authService';
import { signToken } from '../utils/jwt';
import { config } from '../config';

const router = Router() as any;

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }) as any);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }) as any,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      const dbUser = await findOrCreateUser(user.id, user.displayName, user.emails[0].value, user.photos?.[0]?.value);
      const token = signToken({ userId: dbUser.id });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      res.redirect(config.FRONTEND_URL + '/dashboard');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { verifyToken } = await import('../utils/jwt');
    const { userId } = verifyToken(token);
    
    const prisma = (await import('../config/prisma')).default;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatar: true },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}) as any;

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' });
  res.json({ success: true });
}) as any;

if (config.NODE_ENV === 'development' && config.DEV_LOGIN) {
  router.get('/dev-login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisma = (await import('../config/prisma')).default;
      
      let user = await prisma.user.findUnique({
        where: { email: 'dev@test.com' },
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            googleId: 'dev-test-google-id',
            name: 'Dev User',
            email: 'dev@test.com',
            avatar: null,
          },
        });
        
        const { createEtherealAccount } = await import('../utils/nodemailer');
        for (let i = 0; i < 3; i++) {
          try {
            const account = await createEtherealAccount();
            await prisma.sender.create({
              data: {
                userId: user.id,
                etherealUser: account.user,
                etherealPass: account.pass,
                etherealHost: account.smtp.host,
                etherealPort: account.smtp.port,
              },
            });
          } catch (err) {
            console.error('Failed to create Ethereal account:', err);
          }
        }
      }
      
      const token = signToken({ userId: user.id });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      res.json({ user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
    } catch (error) {
      next(error);
    }
  }) as any;
}

export default router;
