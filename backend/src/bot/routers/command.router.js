export const registerCommandRouter = (bot, controller) => {
  bot.command('start', (ctx) => controller.handleStart(ctx));
  bot.command('help', (ctx) => controller.handleHelp(ctx));
  bot.hears(/^\/([a-zA-Z0-9_]+)/, (ctx) => controller.handleUnknownCommand(ctx));
};