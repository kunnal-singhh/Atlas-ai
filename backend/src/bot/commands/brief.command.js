import { BriefingService } from '../../services/briefingService.js';
import logger from '../../utils/logger.js';

export const registerBriefCommand = (bot) => {
  bot.command('brief', async (ctx) => {
    const telegramId = String(ctx.from.id);
    // Parse arguments, e.g., "/brief tech" -> "tech"
    const args = ctx.message?.text?.split(/\s+/).slice(1) || [];
    const focusTopic = args.length > 0 ? args.join(' ').trim() : null;

    try {
      await ctx.sendChatAction('typing');
      
      const content = await BriefingService.generateMorningBrief(telegramId, focusTopic);
      
      await ctx.reply(content, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      logger.error(`Error executing /brief command for ${telegramId}: ${error.message}`);
      await ctx.reply('⚠️ Unable to generate briefing at this moment. Please try again later.');
    }
  });
};
