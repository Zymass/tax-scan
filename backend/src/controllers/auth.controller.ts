import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

  async getMe(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const profile = await this.authService.getUserProfile(req.userId);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const result = await this.authService.register(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    res.json({ message: 'Logged out successfully' });
  }

  async passwordReset(req: Request, res: Response) {
    res.json({ message: 'Password reset functionality not implemented yet' });
  }

  async googleCallback(req: Request, res: Response) {
    try {
      // @ts-ignore - passport attaches user to request
      const result = req.user as { user: any; token: string } | undefined;
      
      if (!result || !result.token) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
    }
  }
}
