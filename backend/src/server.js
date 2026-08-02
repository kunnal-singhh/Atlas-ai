import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { AtlasBot } from './bot/index.js';
import logger from './utils/logger.js';

async function bootstrap() {
  try {
    await connectDatabase();

    const atlasBot = new AtlasBot();
    await atlasBot.start(app);

    const server = app.listen(config.port, () => {
      logger.info(`Atlas AI Express server listening on port ${config.port} in ${config.nodeEnv} mode`);
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
