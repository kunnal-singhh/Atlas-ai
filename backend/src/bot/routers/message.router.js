import { onboardingMiddleware } from '../middlewares/onboarding.middleware.js';

export const registerMessageRouter = (bot, controller) => {
  // Execute onboarding step interception BEFORE standard text router
  bot.use(onboardingMiddleware);

  bot.on('text', (ctx, next) => {
    if (ctx.message.text.startsWith('/')) {
      return next();
    }
    return controller.handleDefaultMessage(ctx);
  });
};