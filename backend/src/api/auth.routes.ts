import { Router, Request, Response } from 'express';
import passport, { isGoogleOAuthEnabled } from '../config/passport.config';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../utils/validators';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Google OAuth routes - only register if OAuth is enabled
if (isGoogleOAuthEnabled) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => authController.googleCallback(req, res)
  );
} else {
  // Return 501 Not Implemented if OAuth routes are accessed but not configured
  router.get('/google', (req: Request, res: Response) => {
    res.status(501).json({ error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' });
  });
  router.get('/google/callback', (req: Request, res: Response) => {
    res.status(501).json({ error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' });
  });
}

// Email/password routes
router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/password-reset', (req, res) => authController.passwordReset(req, res));

// Protected routes
router.get('/me', authMiddleware, (req, res) => authController.getMe(req, res));

export default router;
