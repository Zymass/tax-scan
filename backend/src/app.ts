import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import authRoutes from './api/auth.routes';
import calculationsRoutes from './api/calculations.routes';
import actionsRoutes from './api/actions.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { optionalAuthMiddleware } from './middleware/auth.middleware';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/calculations', optionalAuthMiddleware, calculationsRoutes);
app.use('/api', optionalAuthMiddleware, actionsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Logs will appear here. Watch for [PDF] and [PDF Generator] messages.`);
});

export default app;
