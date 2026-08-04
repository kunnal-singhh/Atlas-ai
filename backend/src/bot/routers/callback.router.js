import { Markup } from 'telegraf';
import { OnboardingController } from '../controllers/onboarding.controller.js';
import { SettingsController } from '../controllers/settings.controller.js';
import { OnboardingService } from '../../services/onboardingService.js';
import { ONBOARDING_STEPS } from '../../constants/onboarding.constants.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import { renderSchedulePanel, renderTimeSelection } from '../commands/schedule.command.js';
import { renderNotificationsPanel } from '../commands/notifications.command.js';
import { SchedulerService } from '../../services/schedulerService.js';

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
      const telegramId = String(ctx.from.id);

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
        return ctx.reply(BOT_MESSAGES.ONB_Q_CUSTOM_TIME, { parse_mode: 'HTML' });
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
      const telegramId = String(ctx.from.id);

      if (data === 'set:close') {
        return ctx.deleteMessage().catch(() => {});
      }
      if (data === 'set:cancel') {
        return settingsController.renderSettingsMenu(ctx);
      }
      if (data === 'set:edit_prof') {
        return settingsController.renderEditProfession(ctx);
      }
      if (data === 'set:edit_ind') {
        return settingsController.renderEditIndustries(ctx, ctx.state.user);
      }
      if (data === 'set:edit_top') {
        return settingsController.renderEditTopics(ctx);
      }
      if (data === 'set:edit_comp') {
        return settingsController.renderEditCompanies(ctx);
      }
      if (data === 'set:edit_time') {
        return settingsController.renderEditBriefTime(ctx);
      }
      if (data === 'set:edit_notif') {
        return settingsController.renderEditNotifications(ctx, ctx.state.user);
      }

      // Profession Select
      if (data.startsWith('set:prof:')) {
        const profession = data.replace('set:prof:', '');
        await onboardingService.updateProfession(telegramId, profession);
        return settingsController.renderSettingsMenu(ctx);
      }

      // Industry Toggle
      if (data.startsWith('set:ind_toggle:')) {
        const industry = data.replace('set:ind_toggle:', '');
        const updatedUser = await onboardingService.toggleIndustry(telegramId, industry);
        return settingsController.renderEditIndustries(ctx, updatedUser);
      }
      if (data === 'set:ind_done') {
        await onboardingService.setSettingsStep(telegramId, null);
        return settingsController.renderSettingsMenu(ctx);
      }

      // Briefing Time
      if (data.startsWith('set:time:')) {
        const timeVal = data.replace('set:time:', '');
        await onboardingService.updateBriefTime(telegramId, timeVal);
        return settingsController.renderSettingsMenu(ctx);
      }
      if (data === 'set:time_custom') {
        await onboardingService.setSettingsStep(telegramId, 'EDIT_CUSTOM_TIME');
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Cancel', 'set:cancel')],
        ]);
        return ctx.editMessageText(BOT_MESSAGES.ONB_Q_CUSTOM_TIME, { parse_mode: 'HTML', ...keyboard });
      }

      // Notification Toggles
      if (data.startsWith('set:notif_toggle:')) {
        const key = data.replace('set:notif_toggle:', '');
        const updatedUser = await onboardingService.toggleNotification(telegramId, key);
        return settingsController.renderEditNotifications(ctx, updatedUser);
      }
      if (data === 'set:notif_done') {
        await onboardingService.setSettingsStep(telegramId, null);
        return settingsController.renderSettingsMenu(ctx);
      }
    }

    // --- SCHEDULER CALLBACK ROUTING ---
    if (data.startsWith('sched:')) {
      const telegramId = String(ctx.from.id);
      
      if (data === 'sched:close') {
        return ctx.deleteMessage().catch(() => {});
      }
      if (data === 'sched:back') {
        await onboardingService.setSettingsStep(telegramId, null);
        return renderSchedulePanel(ctx, telegramId);
      }
      
      if (data.startsWith('sched:edit:')) {
        const type = data.replace('sched:edit:', '');
        return renderTimeSelection(ctx, telegramId, type);
      }
      
      if (data.startsWith('sched:set:')) {
        const parts = data.replace('sched:set:', '').split(':');
        const type = parts[0];
        const time = `${parts[1]}:${parts[2]}`;
        await SchedulerService.setScheduleTime(telegramId, type, time);
        return renderSchedulePanel(ctx, telegramId);
      }
      
      if (data.startsWith('sched:custom:')) {
        const type = data.replace('sched:custom:', '');
        await onboardingService.setSettingsStep(telegramId, `EDIT_CUSTOM_TIME_${type}`);
        return ctx.editMessageText(BOT_MESSAGES.ONB_Q_CUSTOM_TIME, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Cancel', 'sched:back')]])
        });
      }
    }

    // --- NOTIFICATIONS CALLBACK ROUTING ---
    if (data.startsWith('notif:')) {
      const telegramId = String(ctx.from.id);
      
      if (data === 'notif:close') {
        return ctx.deleteMessage().catch(() => {});
      }
      
      if (data.startsWith('notif:toggle:')) {
        const type = data.replace('notif:toggle:', '');
        if (type === 'pauseAll') {
          await SchedulerService.togglePauseAll(telegramId);
        } else {
          await SchedulerService.toggleBriefing(telegramId, type);
        }
        return renderNotificationsPanel(ctx, telegramId);
      }
    }

    return next();
  });
};