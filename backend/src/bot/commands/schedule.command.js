import { Markup } from 'telegraf';
import { SchedulerService } from '../../services/schedulerService.js';
import { escapeHtml } from '../helpers/formatter.helper.js';

export const registerScheduleCommand = (bot) => {
  bot.command('schedule', async (ctx) => {
    const telegramId = String(ctx.from.id);
    await renderSchedulePanel(ctx, telegramId);
  });
};

export const renderSchedulePanel = async (ctx, telegramId) => {
  const prefs = await SchedulerService.getPreferences(telegramId);
  const morningTime = escapeHtml(prefs.morningBrief?.cronTime || '08:00');
  const eveningTime = escapeHtml(prefs.eveningSummary?.cronTime || '18:00');
  const weeklyTime = escapeHtml(prefs.weeklyDigest?.cronTime || '09:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyDay = days[prefs.weeklyDigest?.dayOfWeek ?? 1];

  const message = 
    `⏰ <b>Atlas AI Schedule Panel</b>\n\n` +
    `• <b>Morning Brief:</b> Everyday at <code>${morningTime}</code> UTC\n` +
    `• <b>Evening Summary:</b> Everyday at <code>${eveningTime}</code> UTC\n` +
    `• <b>Weekly Digest:</b> Every <b>${weeklyDay}</b> at <code>${weeklyTime}</code> UTC\n\n` +
    `Select a briefing type to update its scheduled time:`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('☀️ Morning Time', 'sched:edit:morningBrief'),
      Markup.button.callback('🌙 Evening Time', 'sched:edit:eveningSummary')
    ],
    [
      Markup.button.callback('📋 Weekly Time', 'sched:edit:weeklyDigest'),
      Markup.button.callback('❌ Close', 'sched:close')
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

export const renderTimeSelection = async (ctx, telegramId, type) => {
  const times = ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'];
  const label = type === 'morningBrief' ? 'Morning Brief' : type === 'eveningSummary' ? 'Evening Summary' : 'Weekly Digest';

  const rows = times.map((t) => [
    Markup.button.callback(`${t} UTC`, `sched:set:${type}:${t}`),
  ]);
  rows.push([Markup.button.callback('⌚ Custom Time', `sched:custom:${type}`)]);
  rows.push([Markup.button.callback('🔙 Back', 'sched:back')]);

  const prompt = `<b>Update schedule for ${label}</b>\n\nSelect a preset time below or click Custom Time:`;
  await ctx.editMessageText(prompt, { parse_mode: 'HTML', ...Markup.inlineKeyboard(rows) });
};
