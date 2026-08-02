export const registerMessageRouter = (bot, controller) => {
  bot.on('text', (ctx, next) => {
    if (ctx.message.text.startsWith('/')) {
      return next();
    }
    return controller.handleDefaultMessage(ctx);
  });
};