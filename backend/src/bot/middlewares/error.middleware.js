import { BOT_MESSAGES } from '../../constants/messages.constants.js';

export const errorMiddleware = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error(`[Telegram Error] Pipeline error on update ${ctx.update?.update_id}:`, error);

    try {
      if (ctx.chat) {
        await ctx.reply(BOT_MESSAGES.GENERIC_ERROR);
      }
    } catch (sendError) {
      console.error('[Telegram Error] Failed to dispatch error message to user:', sendError);
    }
  }
};