import { createApp } from './app';
import { config } from './config';
import { connectToDatabase, disconnectDatabase } from './config/database';
import { logger } from './services/LoggingService';

async function startServer(): Promise<void> {
  try {
    // 1. Connect to MongoDB (optional)
    try {
      await connectToDatabase();
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Failed to connect to MongoDB, continuing without DB');
    }

    // 2. Initialise Express App
    const app = createApp();

    // 3. Start HTTP Server
    const server = app.listen(config.port, () => {
      logger.info(
        { port: config.port, env: config.nodeEnv },
        `Server listening on port ${config.port} in ${config.nodeEnv} mode`
      );
    });

    // ── Graceful Shutdown ──────────────────────────────────────────

    const shutdown = async (signal: string) => {
      logger.info({ signal }, `Received ${signal}, starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error({ err }, 'Error during HTTP server closure');
        } else {
          logger.info('HTTP server closed');
        }

        try {
          await disconnectDatabase();
          process.exit(0);
        } catch (dbErr) {
          logger.error({ err: dbErr }, 'Error during MongoDB disconnection');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer();
