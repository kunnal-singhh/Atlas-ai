import { ConversationService } from '../../services/conversationService.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import logger from '../../utils/logger.js';

export class ChatController {
  constructor() {
    this.conversationService = new ConversationService();
  }

  /**
   * Handles user chat queries
   */
  async handleUserMessage(ctx) {
    const telegramId = ctx.from.id;
    const text = ctx.message?.text;

    if (!text) return;

    try {
      // Send persistent typing action indicator
      await ctx.sendChatAction('typing');

      // Process message through Conversation Engine
      const responseChunks = await this.conversationService.processUserMessage(
        telegramId,
        text
      );

      // Send formatted chunks to Telegram
      for (const chunk of responseChunks) {
        await ctx.reply(chunk, { parse_mode: 'HTML' }).catch(async () => {
          // Fallback to plain text if Telegram HTML syntax fails
          await ctx.reply(chunk);
        });
      }
    } catch (error) {
      logger.error(`Error in ChatController: ${error.message}`, { stack: error.stack });
      await ctx.reply(BOT_MESSAGES.CHAT_ERROR || '⚠️ I encountered an error processing your query. Please try again.');
    }
  }
}