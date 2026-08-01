import { handleIncomingTextMessage } from '../controllers/botController.js';

export const registerMessageHandlers = (bot) => {
  bot.on('text', handleIncomingTextMessage);
};