import { Markup } from 'telegraf';
import { OnboardingService } from '../services/onboarding.service.js';
import { BOT_MESSAGES } from '../../constants/messages.constants.js';

export class SettingsController {
  constructor() {
    this.service = new OnboardingService();
  }

  /**
   * Display Main Settings Dashboard
   */
  async renderSettingsMenu(ctx) {
    const user = ctx.state.user;
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
        parse_mode: 'MarkdownV2',
        ...keyboard,
      });
    } else {
      await ctx.replyWithMarkdownV2(message, keyboard);
    }
  }
}