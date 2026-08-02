import { OnboardingController } from '../controllers/onboarding.controller.js';
import { SettingsController } from '../controllers/settings.controller.js';
import { OnboardingService } from '../services/onboarding.service.js';
import { ONBOARDING_STEPS } from '../../constants/onboarding.constants.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';

const onboardingController = new OnboardingController();
const settingsController = new SettingsController();
const onboardingService = new OnboardingService();

export const registerCallbackRouter = (bot) => {
  bot.on('callback_query', async (ctx, next) => {
    const data = ctx.callbackQuery?.data;
    if (!data) return next();

    await ctx.answerCbQuery();

    // --- ONBOARDING CALLBACK ROUTING ---
    if (data.startsWith('onb:')) {
      const telegramId = ctx.from.id;

      if (data === 'onb:start') {
        return onboardingController.renderProfessionQuestion(ctx);
      }

      if (data === 'onb:skip') {
        return onboardingController.skip(ctx);
      }

      // Profession
      if (data.startsWith('onb:prof:')) {
        const profession = data.replace('onb:prof:', '');
        const user = await onboardingService.saveProfession(telegramId, profession);
        return onboardingController.renderIndustryQuestion(ctx, user);
      }
      if (data === 'onb:prof_skip') {
        const user = await onboardingService.setStep(telegramId, ONBOARDING_STEPS.ASK_INDUSTRIES);
        return onboardingController.renderIndustryQuestion(ctx, user);
      }

      // Industry Toggle
      if (data.startsWith('onb:ind_toggle:')) {
        const industry = data.replace('onb:ind_toggle:', '');
        const updatedUser = await onboardingService.toggleIndustry(telegramId, industry);
        return onboardingController.renderIndustryQuestion(ctx, updatedUser);
      }
      if (data === 'onb:ind_done' || data === 'onb:ind_skip') {
        return onboardingController.renderTopicsQuestion(ctx);
      }

      // Topics Skip
      if (data === 'onb:topics_skip') {
        return onboardingController.renderCompaniesQuestion(ctx);
      }

      // Companies Skip
      if (data === 'onb:comp_skip') {
        return onboardingController.renderBriefTimeQuestion(ctx);
      }

      // Briefing Time
      if (data.startsWith('onb:time:')) {
        const timeVal = data.replace('onb:time:', '');
        const result = await onboardingService.saveBriefTime(telegramId, timeVal);
        return onboardingController.renderNotificationsQuestion(ctx, result.user);
      }
      if (data === 'onb:time_custom') {
        await onboardingService.setStep(telegramId, ONBOARDING_STEPS.ASK_CUSTOM_TIME);
        return ctx.replyWithMarkdownV2(BOT_MESSAGES.ONB_Q_CUSTOM_TIME);
      }
      if (data === 'onb:time_skip') {
        const user = await onboardingService.setStep(telegramId, ONBOARDING_STEPS.ASK_NOTIFICATIONS);
        return onboardingController.renderNotificationsQuestion(ctx, user);
      }

      // Notification Toggles
      if (data.startsWith('onb:notif_toggle:')) {
        const key = data.replace('onb:notif_toggle:', '');
        const updatedUser = await onboardingService.toggleNotification(telegramId, key);
        return onboardingController.renderNotificationsQuestion(ctx, updatedUser);
      }

      if (data === 'onb:finish') {
        return onboardingController.complete(ctx);
      }
    }

    // --- SETTINGS CALLBACK ROUTING ---
    if (data.startsWith('set:')) {
      if (data === 'set:close') {
        return ctx.deleteMessage().catch(() => {});
      }
      if (data === 'set:edit_prof') {
        return onboardingController.renderProfessionQuestion(ctx);
      }
      if (data === 'set:edit_ind') {
        return onboardingController.renderIndustryQuestion(ctx, ctx.state.user);
      }
      if (data === 'set:edit_top') {
        return onboardingController.renderTopicsQuestion(ctx);
      }
      if (data === 'set:edit_comp') {
        return onboardingController.renderCompaniesQuestion(ctx);
      }
      if (data === 'set:edit_time') {
        return onboardingController.renderBriefTimeQuestion(ctx);
      }
      if (data === 'set:edit_notif') {
        return onboardingController.renderNotificationsQuestion(ctx, ctx.state.user);
      }
    }

    return next();
  });
};