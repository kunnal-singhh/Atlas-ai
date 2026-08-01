import { Telegraf } from 'telegraf';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import { telegramAuthMiddleware } from '../middleware/telegramAuth.js';
import { registerCommandHandlers } from './handlers/commandHandler.js';
import { registerMessageHandlers } from './handlers/messageHandler.js';

export const bot = new Telegraf(config.telegramBotToken);

// Apply User Authentication & Context Enrichment Middleware
bot.use(telegramAuthMiddleware);

// Register Command & Message Handlers
registerCommandHandlers(bot);
registerMessageHandlers(bot);

export const initBot = async () => {
  try {
    await bot.launch();
    logger.info('Telegram bot initialized and polling for updates.');
  } catch (error) {
    logger.error(`Failed to start Telegram bot: ${error.message}`);
  }
};