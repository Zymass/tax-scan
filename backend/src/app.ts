import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Routes
import authRoutes from './api/auth.routes';
import calculationsRoutes from './api/calculations.routes';
import actionsRoutes from './api/actions.routes';
import analyticsRoutes from './api/analytics.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.middleware';

// Passport config (initializes Google OAuth strategy) - imported AFTER dotenv.config()
import './config/passport.config';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (needed when behind nginx reverse proxy)
// Set to 1 to trust the first proxy (nginx) for rate limiting security
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
// Note: We set 'trust proxy' to 1 (not true) to trust only the first proxy (nginx)
// This prevents the ERR_ERL_PERMISSIVE_TRUST_PROXY error
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation since we've explicitly set trust proxy to 1 (safe)
  validate: false
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
// Calculations доступны без авторизации (используется optionalAuthMiddleware внутри)
app.use('/api/calculations', optionalAuthMiddleware, calculationsRoutes);
app.use('/api', authMiddleware, actionsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Logs will appear here. Watch for [PDF] and [PDF Generator] messages.`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the process using this port or use a different port.`);
    console.error(`💡 To find the process: lsof -ti:${PORT}`);
    console.error(`💡 To kill it: kill -9 $(lsof -ti:${PORT})`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

export default app;
