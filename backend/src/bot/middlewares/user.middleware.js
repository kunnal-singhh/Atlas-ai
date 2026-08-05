import { findOrCreateUser } from '../../services/userService.js';
import logger from '../../utils/logger.js';

export const userMiddleware = async (ctx, next) => {
  const telegramUser = ctx.from;

  if (!telegramUser) {
    logger.warn('[User Middleware] Update received without user context.');
    return next();
  }

  try {
    const { user, isNewUser } = await findOrCreateUser({
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      languageCode: telegramUser.language_code,
    });

    ctx.state = {
      ...ctx.state,
      user,
      isNewUser,
    };

    return next();
  } catch (error) {
    logger.error(`[User Middleware] Exception resolving user ${telegramUser?.id}: ${error.message}`, { stack: error.stack });
    throw error;
  }
};