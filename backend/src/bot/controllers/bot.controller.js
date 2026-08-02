import { ResponseHelper } from '../helpers/response.helper.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import { escapeMarkdownV2 } from '../helpers/formatter.helper.js';

export class BotController {
  async handleStart(ctx) {
    const { isNewUser, user } = ctx.state;

    if (isNewUser) {
      await ResponseHelper.sendMarkdown(ctx, BOT_MESSAGES.NEW_USER_WELCOME);
    } else {
      const safeFirstName = escapeMarkdownV2(user.firstName || 'User');
      await ResponseHelper.sendMarkdown(ctx, BOT_MESSAGES.WELCOME_BACK(safeFirstName));
    }
  }

  async handleHelp(ctx) {
    await ResponseHelper.sendMarkdown(ctx, BOT_MESSAGES.HELP);
  }

  async handleUnknownCommand(ctx) {
    await ResponseHelper.sendMarkdown(ctx, BOT_MESSAGES.UNKNOWN_COMMAND);
  }

  async handleDefaultMessage(ctx) {
    await ctx.reply("I'm listening! Additional features will be enabled as modules load.");
  }
}