import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors';
import { apiLimiter } from './config/limiter';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';
import apiRouter from './routes';

export const createApp = (): Express => {
  const app = express();

  // Security headers with Helmet (configured to allow Swagger UI and WebSockets)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for local dev and Swagger inline assets
      crossOriginEmbedderPolicy: false,
    })
  );

  // Cross-Origin Resource Sharing
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'collabdocs-server',
      timestamp: new Date().toISOString(),
    });
  });

  // Swagger Documentation on /api/docs
  setupSwagger(app);

  // Apply rate limiter to /api routes
  app.use('/api', apiLimiter);

  // Mount API router
  app.use('/api', apiRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};

export const app = createApp();
