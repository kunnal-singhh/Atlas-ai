import { handleStartCommand, handleHelpCommand, handleProfileCommand } from '../controllers/botController.js';

export const registerCommandHandlers = (bot) => {
  bot.command('start', handleStartCommand);
  bot.command('help', handleHelpCommand);
  bot.command('profile', handleProfileCommand);
};