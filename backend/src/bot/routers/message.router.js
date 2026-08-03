import { onboardingMiddleware } from '../middlewares/onboarding.middleware.js';
import { settingsMiddleware } from '../middlewares/settings.middleware.js';

export const registerMessageRouter = (bot, chatController) => {
  // Execute onboarding and settings middlewares first to intercept active flows
  bot.use(onboardingMiddleware);
  bot.use(settingsMiddleware);

  bot.on('text', (ctx, next) => {
    // Pass commands through to command router
    if (ctx.message.text.startsWith('/')) {
      return next();
    }
    return chatController.handleUserMessage(ctx);
  });
};