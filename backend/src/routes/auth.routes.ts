import { Router } from 'express';
import passport from '../config/passport';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  authController.googleCallback
);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authController.logout);

router.post('/logout-all', authenticate as any, authController.logoutAll as any);

router.get('/me', authenticate as any, authController.getCurrentUser as any);

router.get('/sessions', authenticate as any, authController.getActiveSessions as any);

router.get('/health', authController.healthCheck);

export default router;
