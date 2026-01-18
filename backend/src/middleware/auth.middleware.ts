import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      req.userId = decoded.userId;
    } catch (error) {
      // Silently ignore invalid token for optional auth
    }
  }

  next();
};
