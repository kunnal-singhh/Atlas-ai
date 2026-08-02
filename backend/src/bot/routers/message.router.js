import { onboardingMiddleware } from '../middlewares/onboarding.middleware.js';

export const registerMessageRouter = (bot, chatController) => {
  // Execute onboarding middleware first to intercept active flows
  bot.use(onboardingMiddleware);

  bot.on('text', (ctx, next) => {
    // Pass commands through to command router
    if (ctx.message.text.startsWith('/')) {
      return next();
    }
    return chatController.handleUserMessage(ctx);
  });
};