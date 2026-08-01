import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { initBot, bot } from './bot/bot.js';
import logger from './utils/logger.js';

const startServer = async () => {
  await connectDatabase();
  await initBot();

  const server = app.listen(config.port, () => {
    logger.info(`Atlas AI Express server listening on port ${config.port} in ${config.nodeEnv} mode`);
  });

  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    
    bot.stop(signal);
    logger.info('Telegram bot stopped.');

    server.close(() => {
      logger.info('Express HTTP server closed.');
      process.exit(0);
    });
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

startServer();