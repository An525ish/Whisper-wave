import { createServer } from 'http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env, isProd } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { stopAllPresenceSweeps } from './services/match/presence.js';
import { createSocketServer } from './socket/index.js';
import { logger } from './utils/logger.js';

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

app.set('io', io);

let isShuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown started');

  // Stop scheduling new match teardowns before we close the Redis connection
  // they depend on.
  stopAllPresenceSweeps();

  httpServer.close(async () => {
    try {
      await Promise.all([
        mongoose.connection.close(),
        disconnectRedis(),
      ]);
      logger.info('MongoDB and Redis connections closed');
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

    // Redis is a hard dependency for /whisper. Booting without it produced a
    // server that looked healthy on /health while every anon route failed
    // opaquely — worse than not starting at all. In production we refuse to
    // come up; in dev we warn loudly and keep the connected layer usable.
    try {
      await connectRedis();
    } catch (error) {
      if (isProd) {
        logger.error({ err: error }, 'Redis is required in production — aborting startup');
        process.exit(1);
      }
      logger.error(
        { err: error },
        'Redis unavailable — anonymous Whisper matching is disabled until it recovers'
      );
    }

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
