import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { AtlasBot } from './bot/index.js';
import logger from './utils/logger.js';

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception detected!', {
    message: error.message,
    stack: error.stack,
  });
  // Graceful exit after logging to avoid unstable state
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected!', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

async function bootstrap() {
  try {
    await connectDatabase();

    const atlasBot = new AtlasBot();

    const server = app.listen(config.port, async () => {
      logger.info(`Atlas AI Express server listening on port ${config.port} in ${config.nodeEnv} mode`);
      try {
        // Start bot webhook or polling only after the server is successfully listening
        await atlasBot.start(app);
      } catch (botError) {
        logger.error(`Failed to start Telegram bot: ${botError.message}`, { stack: botError.stack });
        // Depending on requirements, you might want to exit here, or keep the web server running
      }
    });

    const shutdownServer = (signal) => {
      logger.info(`Received ${signal}. Closing Express HTTP server...`);
      server.close(() => {
        logger.info('Express HTTP server closed.');
      });
    };

    process.once('SIGINT', () => shutdownServer('SIGINT'));
    process.once('SIGTERM', () => shutdownServer('SIGTERM'));
  } catch (error) {
    logger.error(`Fatal error during application startup: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
}

bootstrap();
