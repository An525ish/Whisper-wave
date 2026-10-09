import { createServer } from 'http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env, isProd } from './config/env.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { purgeQueue } from './services/match/queue.js';
import { startPresenceSweeper, stopAllPresenceSweeps } from './services/match/presence.js';
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

  // Armed first: the awaits below must not be able to outlive it.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();

  // Stop scheduling new match teardowns before we close the Redis connection
  // they depend on. Pending grace periods stay in Redis for the next boot.
  stopAllPresenceSweeps();

  try {
    // Socket.IO first: it disconnects every client (a plain `httpServer.close`
    // waits for open websockets and would sit out the 10 s forced exit) and then
    // closes the HTTP server it is attached to. The callback's error is only
    // "server was not running", which is fine on a shutdown that raced boot.
    await new Promise<void>((resolve) => {
      io.close((err) => {
        if (err) logger.debug({ err }, 'Socket.IO close reported an error');
        resolve();
      });
      // Keep-alive HTTP connections would otherwise hold `close` open.
      httpServer.closeIdleConnections();
    });

    await Promise.all([mongoose.connection.close(), disconnectRedis()]);
    logger.info('Socket.IO, HTTP, MongoDB and Redis closed');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }

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

      // Every socket died with the previous process, so anything still in the
      // queue is a ghost that would be claimed and paired with nobody. Clients
      // re-enter on reconnect. Single-process assumption — see `purgeQueue`.
      await purgeQueue();

      // Grace periods the previous process left in Redis must still be honoured:
      // arm the sweeper once now; it stops itself if there is nothing to sweep.
      startPresenceSweeper(io.of('/anon'));
    } catch (error) {
      if (isProd) {
        logger.error({ err: error }, 'Redis is required in production — aborting startup');
        process.exit(1);
      }
      // The client keeps reconnecting in the background, so this recovers on its
      // own — but the boot-time queue purge and sweeper arming were skipped, so a
      // stale queue from a previous run may survive until it is dequeued.
      logger.error(
        { err: error },
        'Redis unreachable at boot — whisper routes fail until it reconnects'
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
