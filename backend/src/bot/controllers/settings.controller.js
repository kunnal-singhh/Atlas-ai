import { Markup } from 'telegraf';
import { OnboardingService } from '../../services/onboardingService.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';
import {
  SETTINGS_STEPS,
  PRESET_PROFESSIONS,
  PRESET_INDUSTRIES,
  PRESET_BRIEF_TIMES,
  NOTIFICATION_TYPES,
} from '../../constants/onboarding.constants.js';

export class SettingsController {
  constructor() {
    this.service = new OnboardingService();
  }

  /**
   * Display Main Settings Dashboard
   */
  async renderSettingsMenu(ctx) {
    const user = await this.service.setSettingsStep(String(ctx.from.id), null);
    const message = BOT_MESSAGES.SETTINGS_HEADER(user);

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💼 Edit Profession', 'set:edit_prof')],
      [Markup.button.callback('🏭 Edit Industries', 'set:edit_ind')],
      [Markup.button.callback('🏷️ Edit Topics', 'set:edit_top')],
      [Markup.button.callback('🏢 Edit Companies', 'set:edit_comp')],
      [Markup.button.callback('⏰ Edit Briefing Time', 'set:edit_time')],
      [Markup.button.callback('🔔 Edit Notifications', 'set:edit_notif')],
      [Markup.button.callback('❌ Close Menu', 'set:close')],
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        ...keyboard,
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'HTML',
        ...keyboard,
      });
    }
  }

  async renderEditProfession(ctx) {
    const telegramId = String(ctx.from.id);
    await this.service.setSettingsStep(telegramId, SETTINGS_STEPS.EDIT_PROFESSION);

    const rows = PRESET_PROFESSIONS.map((prof) => [
      Markup.button.callback(prof, `set:prof:${prof}`),
    ]);
    rows.push([Markup.button.callback('🔙 Cancel', 'set:cancel')]);

    const prompt = '<b>Edit Profession</b>\n\nWhat do you do? Select an option below or type your custom profession directly:';
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
    } else {
      await ctx.reply(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
    }
  }

  async renderEditIndustries(ctx, user) {
    const telegramId = String(ctx.from.id);
    await this.service.setSettingsStep(telegramId, SETTINGS_STEPS.EDIT_INDUSTRIES);

    const selected = user.preferences?.industries || [];
    const buttons = PRESET_INDUSTRIES.map((ind) => {
      const isChecked = selected.includes(ind);
      const label = `${isChecked ? '✅' : '▫️'} ${ind}`;
      return [Markup.button.callback(label, `set:ind_toggle:${ind}`)];
    });

    buttons.push([
      Markup.button.callback('➡️ Done', 'set:ind_done'),
      Markup.button.callback('🔙 Cancel', 'set:cancel'),
    ]);

    const prompt = '<b>Edit Industry Focus</b>\n\nWhich industries are you interested in? (Select all that apply, then press <b>Done</b>):';

    if (ctx.callbackQuery) {
      await ctx.editMessageText(prompt, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      });
    } else {
      await ctx.reply(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    }
  }

  async renderEditTopics(ctx) {
    const telegramId = String(ctx.from.id);
    await this.service.setSettingsStep(telegramId, SETTINGS_STEPS.EDIT_TOPICS);

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Cancel', 'set:cancel')],
    ]);

    const prompt = '<b>Edit Core Topics</b>\n\nWhich specific topics do you follow? (e.g., <i>LLMs, Macroeconomics, Quantum Computing</i>)\n\nType your topics separated by commas:';
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(prompt, { parse_mode: 'HTML', ...keyboard });
    } else {
      await ctx.reply(prompt, { parse_mode: 'HTML', ...keyboard });
    }
  }

  async renderEditCompanies(ctx) {
    const telegramId = String(ctx.from.id);
    await this.service.setSettingsStep(telegramId, SETTINGS_STEPS.EDIT_COMPANIES);

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Cancel', 'set:cancel')],
    ]);

    const prompt = '<b>Edit Companies</b>\n\nWhich companies or organizations do you follow? (e.g., <i>NVIDIA, OpenAI, Tesla</i>)\n\nType company names separated by commas:';
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(prompt, { parse_mode: 'HTML', ...keyboard });
    } else {
      await ctx.reply(prompt, { parse_mode: 'HTML', ...keyboard });
    }
  }

  async renderEditBriefTime(ctx) {
    const telegramId = String(ctx.from.id);
    await this.service.setSettingsStep(telegramId, SETTINGS_STEPS.EDIT_BRIEF_TIME);

    const buttons = PRESET_BRIEF_TIMES.map((time) => [
      Markup.button.callback(time.label, `set:time:${time.value}`),
    ]);
    buttons.push([Markup.button.callback('⌚ Custom Time', 'set:time_custom')]);
    buttons.push([Markup.button.callback('🔙 Cancel', 'set:cancel')]);

    const prompt = '<b>Edit Daily Briefing Schedule</b>\n\nWhat time would you like to receive your daily briefing?';

    if (ctx.callbackQuery) {
      await ctx.editMessageText(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    } else {
      await ctx.reply(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    }
  }

  async renderEditNotifications(ctx, user) {
    const telegramId = String(ctx.from.id);
    await this.service.setSettingsStep(telegramId, SETTINGS_STEPS.EDIT_NOTIFICATIONS);

    const activeNotifs = user.preferences?.notifications || {};
    const buttons = NOTIFICATION_TYPES.map((type) => {
      const isChecked = activeNotifs[type.key] ?? false;
      const label = `${isChecked ? '✅' : '▫️'} ${type.label}`;
      return [Markup.button.callback(label, `set:notif_toggle:${type.key}`)];
    });

    buttons.push([
      Markup.button.callback('➡️ Done', 'set:notif_done'),
      Markup.button.callback('🔙 Cancel', 'set:cancel'),
    ]);

    const prompt = '<b>Edit Notification Preferences</b>\n\nChoose the types of updates you would like to receive:';

    if (ctx.callbackQuery) {
      await ctx.editMessageText(prompt, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      });
    } else {
      await ctx.reply(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    }
  }
}