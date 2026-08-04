import { SETTINGS_STEPS } from '../../constants/onboarding.constants.js';
import { OnboardingService } from '../../services/onboardingService.js';
import { SettingsController } from '../controllers/settings.controller.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import { SchedulerService } from '../../services/schedulerService.js';
import { renderSchedulePanel } from '../commands/schedule.command.js';

const onboardingService = new OnboardingService();
const settingsController = new SettingsController();

export const settingsMiddleware = async (ctx, next) => {
  const user = ctx.state?.user;

  // Pass if no user or not currently editing settings
  if (!user || !user.settingsStep) {
    return next();
  }

  // Intercept text messages sent during active settings editing steps
  if (ctx.message && ctx.message.text) {
    const text = ctx.message.text.trim();

    // Ignore commands so user can execute /start or /help or /settings
    if (text.startsWith('/')) {
      return next();
    }

    // Intercept custom scheduler times
    if (user.settingsStep.startsWith('EDIT_CUSTOM_TIME_')) {
      const type = user.settingsStep.replace('EDIT_CUSTOM_TIME_', '');
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(text)) {
        return ctx.reply(BOT_MESSAGES.ONB_INVALID_TIME, { parse_mode: 'HTML' });
      }

      await SchedulerService.setScheduleTime(user.telegramId, type, text);
      await onboardingService.setSettingsStep(user.telegramId, null);
      await ctx.reply(`✅ Scheduled time updated to ${text} UTC.`);
      return renderSchedulePanel(ctx, user.telegramId);
    }

    switch (user.settingsStep) {
      case SETTINGS_STEPS.EDIT_PROFESSION: {
        await onboardingService.updateProfession(user.telegramId, text);
        await ctx.reply('✅ Profession updated successfully.');
        return settingsController.renderSettingsMenu(ctx);
      }

      case SETTINGS_STEPS.EDIT_TOPICS: {
        await onboardingService.updateListInput(user.telegramId, 'topics', text);
        await ctx.reply('✅ Core topics updated successfully.');
        return settingsController.renderSettingsMenu(ctx);
      }

      case SETTINGS_STEPS.EDIT_COMPANIES: {
        await onboardingService.updateListInput(user.telegramId, 'companies', text);
        await ctx.reply('✅ Companies updated successfully.');
        return settingsController.renderSettingsMenu(ctx);
      }

      case SETTINGS_STEPS.EDIT_CUSTOM_TIME: {
        const result = await onboardingService.updateBriefTime(user.telegramId, text);
        if (!result.success) {
          return ctx.reply(BOT_MESSAGES.ONB_INVALID_TIME, { parse_mode: 'HTML' });
        }
        await ctx.reply('✅ Briefing time updated successfully.');
        return settingsController.renderSettingsMenu(ctx);
      }

      default:
        return next();
    }
  }

  return next();
};
