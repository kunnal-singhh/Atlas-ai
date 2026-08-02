export const registerCommandRouter = (bot, controller, settingsController) => {
  bot.command('start', (ctx) => controller.handleStart(ctx));
  bot.command('help', (ctx) => controller.handleHelp(ctx));
  bot.command('settings', (ctx) => settingsController.renderSettingsMenu(ctx));
  bot.hears(/^\/([a-zA-Z0-9_]+)/, (ctx) => controller.handleUnknownCommand(ctx));
};