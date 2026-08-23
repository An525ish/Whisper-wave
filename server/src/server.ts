import { createServer } from 'http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { configureCloudinary } from './config/cloudinary.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { createSocketServer } from './socket/index.js';
import { logger } from './utils/logger.js';

configureCloudinary();

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

app.set('io', io);

let isShuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown started');

  httpServer.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

const start = async (): Promise<void> => {
  try {
    await connectDb();

    httpServer.listen(env.PORT, () => {
      logger.info(
        `Server running on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});
process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException');
});

void start();
