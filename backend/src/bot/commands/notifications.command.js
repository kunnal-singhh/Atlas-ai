import { Markup } from 'telegraf';
import { SchedulerService } from '../../services/schedulerService.js';

export const registerNotificationsCommand = (bot) => {
  bot.command('notifications', async (ctx) => {
    const telegramId = String(ctx.from.id);
    await renderNotificationsPanel(ctx, telegramId);
  });
};

export const renderNotificationsPanel = async (ctx, telegramId) => {
  const prefs = await SchedulerService.getPreferences(telegramId);
  
  const mStatus = prefs.morningBrief?.enabled ? '✅ Enabled' : '❌ Disabled';
  const eStatus = prefs.eveningSummary?.enabled ? '✅ Enabled' : '❌ Disabled';
  const wStatus = prefs.weeklyDigest?.enabled ? '✅ Enabled' : '❌ Disabled';
  const pStatus = prefs.pauseAll ? '⏸️ Paused (All delivery suspended)' : '▶️ Active';

  const message = 
    `🔔 <b>Atlas AI Notification Center</b>\n\n` +
    `• <b>Morning Brief:</b> ${mStatus}\n` +
    `• <b>Evening Summary:</b> ${eStatus}\n` +
    `• <b>Weekly Digest:</b> ${wStatus}\n` +
    `• <b>Global Pause:</b> ${pStatus}\n\n` +
    `Toggle individual preferences below:`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(`${prefs.morningBrief?.enabled ? '✅' : '▫️'} Morning Brief`, 'notif:toggle:morningBrief'),
      Markup.button.callback(`${prefs.eveningSummary?.enabled ? '✅' : '▫️'} Evening Summary`, 'notif:toggle:eveningSummary')
    ],
    [
      Markup.button.callback(`${prefs.weeklyDigest?.enabled ? '✅' : '▫️'} Weekly Digest`, 'notif:toggle:weeklyDigest'),
      Markup.button.callback(`${prefs.pauseAll ? '⏸️ Resume All' : '▶️ Pause All'}`, 'notif:toggle:pauseAll')
    ],
    [
      Markup.button.callback('❌ Close Panel', 'notif:close')
    ]
  ]);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(message, { parse_mode: 'HTML', ...keyboard });
    } catch {
      await ctx.reply(message, { parse_mode: 'HTML', ...keyboard });
    }
  } else {
    await ctx.reply(message, { parse_mode: 'HTML', ...keyboard });
  }
};
