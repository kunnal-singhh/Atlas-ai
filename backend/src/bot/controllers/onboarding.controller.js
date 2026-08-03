import { Markup } from 'telegraf';
import { OnboardingService } from '../../services/onboardingService.js';
import { ResponseHelper } from '../helpers/response.helper.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import {
  ONBOARDING_STEPS,
  PRESET_PROFESSIONS,
  PRESET_INDUSTRIES,
  PRESET_BRIEF_TIMES,
  NOTIFICATION_TYPES,
} from '../../constants/onboarding.constants.js';

export class OnboardingController {
  constructor() {
    this.service = new OnboardingService();
  }

  /**
   * Show Initial Welcome Prompt
   */
  async startOnboardingPrompt(ctx) {
    await ctx.sendChatAction('typing');
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Continue', 'onb:start')],
      [Markup.button.callback('⏭️ Skip for Now', 'onb:skip')],
    ]);

    await ctx.reply(BOT_MESSAGES.WELCOME_INTRO, { parse_mode: 'HTML', ...buttons });
  }

  /**
   * Step 1: Profession
   */
  async renderProfessionQuestion(ctx) {
    await this.service.setStep(String(ctx.from.id), ONBOARDING_STEPS.ASK_PROFESSION);

    const rows = PRESET_PROFESSIONS.map((prof) => [
      Markup.button.callback(prof, `onb:prof:${prof}`),
    ]);
    rows.push([Markup.button.callback('⏭️ Skip Step', 'onb:prof_skip')]);

    await ctx.reply(BOT_MESSAGES.ONB_Q_PROFESSION, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
  }

  /**
   * Step 2: Industries (Multi-Select)
   */
  async renderIndustryQuestion(ctx, user) {
    await this.service.setStep(String(ctx.from.id), ONBOARDING_STEPS.ASK_INDUSTRIES);

    const selected = user.preferences?.industries || [];
    const buttons = PRESET_INDUSTRIES.map((ind) => {
      const isChecked = selected.includes(ind);
      const label = `${isChecked ? '✅' : '▫️'} ${ind}`;
      return [Markup.button.callback(label, `onb:ind_toggle:${ind}`)];
    });

    buttons.push([
      Markup.button.callback('➡️ Next Step', 'onb:ind_done'),
      Markup.button.callback('⏭️ Skip', 'onb:ind_skip'),
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(BOT_MESSAGES.ONB_Q_INDUSTRIES, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      });
    } else {
      await ctx.reply(BOT_MESSAGES.ONB_Q_INDUSTRIES, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    }
  }

  /**
   * Step 3: Topics
   */
  async renderTopicsQuestion(ctx) {
    await this.service.setStep(String(ctx.from.id), ONBOARDING_STEPS.ASK_TOPICS);
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏭️ Skip Step', 'onb:topics_skip')],
    ]);

    await ctx.reply(BOT_MESSAGES.ONB_Q_TOPICS, { parse_mode: 'HTML', ...keyboard });
  }

  /**
   * Step 4: Companies
   */
  async renderCompaniesQuestion(ctx) {
    await this.service.setStep(String(ctx.from.id), ONBOARDING_STEPS.ASK_COMPANIES);
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⏭️ Skip Step', 'onb:comp_skip')],
    ]);

    await ctx.reply(BOT_MESSAGES.ONB_Q_COMPANIES, { parse_mode: 'HTML', ...keyboard });
  }

  /**
   * Step 5: Briefing Time
   */
  async renderBriefTimeQuestion(ctx) {
    await this.service.setStep(String(ctx.from.id), ONBOARDING_STEPS.ASK_BRIEF_TIME);

    const buttons = PRESET_BRIEF_TIMES.map((time) => [
      Markup.button.callback(time.label, `onb:time:${time.value}`),
    ]);
    buttons.push([Markup.button.callback('⌚ Custom Time', 'onb:time_custom')]);
    buttons.push([Markup.button.callback('⏭️ Skip Step', 'onb:time_skip')]);

    await ctx.reply(BOT_MESSAGES.ONB_Q_BRIEF_TIME, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
  }

  /**
   * Step 6: Notifications (Multi-Select)
   */
  async renderNotificationsQuestion(ctx, user) {
    await this.service.setStep(String(ctx.from.id), ONBOARDING_STEPS.ASK_NOTIFICATIONS);

    const activeNotifs = user.preferences?.notifications || {};
    const buttons = NOTIFICATION_TYPES.map((type) => {
      const isChecked = activeNotifs[type.key] ?? false;
      const label = `${isChecked ? '✅' : '▫️'} ${type.label}`;
      return [Markup.button.callback(label, `onb:notif_toggle:${type.key}`)];
    });

    buttons.push([Markup.button.callback('🎉 Finish Setup', 'onb:finish')]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(BOT_MESSAGES.ONB_Q_NOTIFICATIONS, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      });
    } else {
      await ctx.reply(
        BOT_MESSAGES.ONB_Q_NOTIFICATIONS,
        { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
      );
    }
  }

  /**
   * Final Completion
   */
  async complete(ctx) {
    await this.service.completeOnboarding(String(ctx.from.id));
    await ctx.reply(BOT_MESSAGES.ONB_COMPLETED, { parse_mode: 'HTML' });
  }

  /**
   * Skip Flow
   */
  async skip(ctx) {
    await this.service.skipOnboarding(String(ctx.from.id));
    await ctx.reply(BOT_MESSAGES.ONB_CANCELLED, { parse_mode: 'HTML' });
  }
}