import { registerBriefCommand } from '../commands/brief.command.js';
import { registerScheduleCommand } from '../commands/schedule.command.js';
import { registerNotificationsCommand } from '../commands/notifications.command.js';

export const registerCommandRouter = (bot, controller, settingsController) => {
  bot.command('start', (ctx) => controller.handleStart(ctx));
  bot.command('help', (ctx) => controller.handleHelp(ctx));
  bot.command('settings', (ctx) => settingsController.renderSettingsMenu(ctx));
  
  // Register Module 9 commands
  registerBriefCommand(bot);
  registerScheduleCommand(bot);
  registerNotificationsCommand(bot);
  
  bot.hears(/^\/([a-zA-Z0-9_]+)/, (ctx) => controller.handleUnknownCommand(ctx));
};