import { ResponseHelper } from '../helpers/response.helper.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import { OnboardingController } from './onboarding.controller.js';

const onboardingController = new OnboardingController();

export class BotController {
  async handleStart(ctx) {
    const { isNewUser, user } = ctx.state;

    // Trigger onboarding prompt for both new users and restart calls
    await onboardingController.startOnboardingPrompt(ctx);
  }

  async handleHelp(ctx) {
    await ResponseHelper.sendMarkdown(ctx, BOT_MESSAGES.HELP);
  }

  async handleUnknownCommand(ctx) {
    await ResponseHelper.sendMarkdown(ctx, BOT_MESSAGES.UNKNOWN_COMMAND);
  }

  async handleDefaultMessage(ctx) {
    await ctx.reply("I'm listening! Type /settings to adjust your preferences.");
  }
}