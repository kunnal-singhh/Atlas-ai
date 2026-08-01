import { findOrCreateUser } from '../services/userService.js';
import logger from '../utils/logger.js';

export const telegramAuthMiddleware = async (ctx, next) => {
  try {
    if (!ctx.from) {
      return next();
    }

    const dbUser = await findOrCreateUser(ctx.from);
    ctx.state.user = dbUser;

    return next();
  } catch (error) {
    logger.error(`Error in Telegram Auth Middleware: ${error.message}`);
    return ctx.reply('⚠️ Service temporary unavailable. Please try again.');
  }
};