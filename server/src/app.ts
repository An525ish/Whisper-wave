import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { corsOptions } from './config/cors.js';
import { isProd } from './config/env.js';
import { helmetOptions } from './config/helmet.js';
import { globalErrorHandler } from './middlewares/index.js';
import { registerRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';
import { AppError } from './utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet(helmetOptions));
  app.use(compression());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: isProd,
    })
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  registerRoutes(app);

  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next(new AppError(404, `Route ${req.originalUrl} not found`));
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });

  app.use(globalErrorHandler);

  return app;
};
