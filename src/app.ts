import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import noticeRoutes from './routes/noticeRoutes';
import eventRoutes from './routes/eventRoutes';
import listingRoutes from './routes/listingRoutes';
import directoryRoutes from './routes/directoryRoutes';
import helplineRoutes from './routes/helplineRoutes';
import discussionRoutes from './routes/discussionRoutes';
import committeeRoutes from './routes/committeeRoutes';
import adminRoutes from './routes/adminRoutes';
import communityRoutes from './routes/communityRoutes';
import complaintRoutes from './routes/complaintRoutes';
import adPosterRoutes from './routes/adPosterRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, postman (origin === undefined) and localhost
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/staging to avoid blocking mobile emulators
      }
    },
    credentials: true,
  })
);

// Logging & Body parsing
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/admin-login', authLimiter);

// Health check handler
const healthHandler = (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'ok',
    service: 'Mitra — Stronger Together Community API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: statusMap[dbStatus] || 'unknown',
      host: mongoose.connection.host || 'local',
      name: mongoose.connection.name || 'mitra_db',
    },
    society: 'Greenwood Heights Society',
  });
};

app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Mount Routes under both /api and /api/v1 for 100% compatibility
const routePrefixes = ['/api', '/api/v1'];

routePrefixes.forEach((prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/notices`, noticeRoutes);
  app.use(`${prefix}/announcements`, noticeRoutes);
  app.use(`${prefix}/events`, eventRoutes);
  app.use(`${prefix}/classifieds`, listingRoutes);
  app.use(`${prefix}/directory`, directoryRoutes);
  app.use(`${prefix}/helplines`, helplineRoutes);
  app.use(`${prefix}/discussions`, discussionRoutes);
  app.use(`${prefix}/committee`, committeeRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/communities`, communityRoutes);
  app.use(`${prefix}/complaints`, complaintRoutes);
  app.use(`${prefix}/reports`, complaintRoutes);
  app.use(`${prefix}/ads`, adPosterRoutes);
  app.use(`${prefix}/campaigns`, adPosterRoutes);
  app.use(`${prefix}/posters`, adPosterRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/devices`, notificationRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
