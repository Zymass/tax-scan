import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

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
}
