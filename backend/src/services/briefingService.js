import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { MemoryService } from './memoryService.js';
import { financeService } from './financeService.js';
import { aiService } from './aiService.js';
import { escapeHtml } from '../bot/helpers/formatter.helper.js';
import logger from '../utils/logger.js';

/**
 * BriefingService — Pure content generator for scheduled intelligence.
 *
 * This service ONLY returns formatted HTML strings.
 * It never sends Telegram messages — that is NotificationService's responsibility.
 *
 * Data flow per briefing:
 *   User Profile → Memory → Finance → Conversation Context → AI → HTML
 */
export class BriefingService {
  // ─────────────────────────────────────────────────────────
  // Morning Brief — Personalized executive daily briefing
  // ─────────────────────────────────────────────────────────
  /**
   * @param {string} telegramId
   * @param {string|null} [focusTopic] Optional vertical focus (tech, finance, ai, etc.)
   * @returns {Promise<string>} Telegram HTML
   */
  static async generateMorningBrief(telegramId, focusTopic = null) {
    try {
      // 1. User Profile
      const user = await User.findOne({ telegramId }).lean();
      const profile = BriefingService._extractProfile(user);

      // 2. Long-Term Memories
      const memories = await MemoryService.getRelevantMemories(
        telegramId,
        focusTopic || 'daily briefing finance market'
      );

      // 3. Finance Intelligence (reuse existing pipeline — NO news generation)
      const symbol = BriefingService._topicToSymbol(focusTopic);
      const financeData = await financeService.getFinancialBriefing(telegramId, { symbol });

      // 4. AI Personalization Pass
      const personalizedHtml = await BriefingService._generatePersonalizedBrief({
        profile,
        memories,
        financeData,
        focusTopic,
        briefingType: 'morning',
      });

      return personalizedHtml;
    } catch (err) {
      logger.error('BriefingService.generateMorningBrief failed:', { error: err.message, telegramId });
      return BriefingService._fallbackMorningBrief(telegramId);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Evening Summary — Recap of today's interactions
  // ─────────────────────────────────────────────────────────
  static async generateEveningSummary(telegramId) {
    try {
      const user = await User.findOne({ telegramId }).lean();
      const profile = BriefingService._extractProfile(user);

      // Fetch today's conversation turns
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayMessages = await Message.find({
        telegramId,
        createdAt: { $gte: todayStart },
      })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();

      // Memories accumulated today
      const memories = await MemoryService.getRelevantMemories(telegramId, 'daily summary recap');

      const conversationText = todayMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')
        .substring(0, 3000);

      // AI summary
      const summaryPrompt = `You are Atlas AI generating an evening summary for the user.
User Profile: ${profile.profession}, interested in ${profile.industries}.

Today's conversations:
${conversationText || 'No conversations today.'}

${memories.length > 0 ? `Known facts about user:\n${memories.map((m) => `- ${m.fact}`).join('\n')}` : ''}

Generate a warm, concise evening recap in this structure:
1. A personalized greeting using the user's name (${profile.firstName})
2. Summary of key topics discussed today (2-3 bullet points)
3. Any new facts learned about the user
4. A brief forward-looking note for tomorrow

Keep it concise and warm. Do not use markdown — use plain text only.`;

      let summaryText;
      try {
        summaryText = await aiService.generateResponse({
          systemInstruction: summaryPrompt,
          contents: [{ role: 'user', parts: [{ text: 'Generate the evening summary.' }] }],
        });
      } catch {
        summaryText = null;
      }

      return BriefingService._formatEveningSummary(profile, todayMessages.length, summaryText);
    } catch (err) {
      logger.error('BriefingService.generateEveningSummary failed:', { error: err.message, telegramId });
      return BriefingService._fallbackEveningSummary();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Weekly Digest — 7-day intelligence synthesis
  // ─────────────────────────────────────────────────────────
  static async generateWeeklyDigest(telegramId) {
    try {
      const user = await User.findOne({ telegramId }).lean();
      const profile = BriefingService._extractProfile(user);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const weekMessages = await Message.countDocuments({
        telegramId,
        createdAt: { $gte: weekAgo },
      });

      const memories = await MemoryService.getRelevantMemories(telegramId, 'weekly digest overview');

      // Finance briefing for the digest
      const financeData = await financeService.getFinancialBriefing(telegramId, {});

      const digestPrompt = `You are Atlas AI generating a weekly digest for ${profile.firstName}.
User Profile: ${profile.profession}, follows ${profile.companies}, interested in ${profile.industries}.

This week stats: ${weekMessages} messages exchanged.
${memories.length > 0 ? `Known preferences:\n${memories.map((m) => `- [${m.category}] ${m.fact}`).join('\n')}` : ''}

Market overview: ${financeData.raw?.summaryText || 'No market data available.'}

Generate a concise weekly digest with:
1. Personalized greeting
2. Week in review (2-3 key highlights)
3. Market snapshot relevant to user's interests
4. Suggested focus areas for next week

Keep it executive-level and concise. Do not use markdown — use plain text only.`;

      let digestText;
      try {
        digestText = await aiService.generateResponse({
          systemInstruction: digestPrompt,
          contents: [{ role: 'user', parts: [{ text: 'Generate the weekly digest.' }] }],
        });
      } catch {
        digestText = null;
      }

      return BriefingService._formatWeeklyDigest(profile, weekMessages, memories, financeData, digestText);
    } catch (err) {
      logger.error('BriefingService.generateWeeklyDigest failed:', { error: err.message, telegramId });
      return BriefingService._fallbackWeeklyDigest();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — AI Personalization + Formatting
  // ═══════════════════════════════════════════════════════════

  static async _generatePersonalizedBrief({ profile, memories, financeData, focusTopic, briefingType }) {
    const memoryContext = memories.length > 0
      ? memories.map((m) => `- [${m.category}] ${m.fact}`).join('\n')
      : 'No stored preferences yet.';

    const financeContext = financeData.raw?.summaryText || 'No market data available.';
    const stories = financeData.raw?.structuredUpdates || [];

    const aiPrompt = `You are Atlas AI's Daily Briefing Engine generating a personalized ${briefingType} briefing.

USER PROFILE:
- Name: ${profile.firstName}
- Profession: ${profile.profession}
- Industries: ${profile.industries}
- Topics: ${profile.topics}
- Companies Followed: ${profile.companies}

USER MEMORIES:
${memoryContext}

MARKET INTELLIGENCE:
${financeContext}
${stories.length > 0 ? `\nTop Stories:\n${stories.map((s, i) => `${i + 1}. ${s.headline} (${(s.symbols || []).join(', ')}): ${s.summary}`).join('\n')}` : ''}

${focusTopic ? `FOCUS TOPIC: ${focusTopic}` : ''}

Generate a warm, personalized morning briefing following this exact structure:
1. Personal greeting using the name "${profile.firstName}" and time-of-day awareness
2. "Here's what matters today" section — prioritize news relevant to the user's followed companies and industries
3. Market snapshot — 2-3 key movements
4. "Why this matters to you" — connect the news to the user's profession and interests
5. Suggested watchlist — 2-3 tickers based on user's preferences
6. Today's focus — one actionable suggestion

Be concise, executive-level, and warm. Do not use markdown — use plain text only.
Do not make up financial data. Only reference the market intelligence provided above.`;

    let aiResponse;
    try {
      aiResponse = await aiService.generateResponse({
        systemInstruction: aiPrompt,
        contents: [{ role: 'user', parts: [{ text: 'Generate my personalized morning briefing.' }] }],
      });
    } catch {
      aiResponse = null;
    }

    return BriefingService._formatMorningBrief(profile, memories, financeData, aiResponse, focusTopic);
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — HTML Formatters (Telegram HTML parse mode)
  // ═══════════════════════════════════════════════════════════

  static _formatMorningBrief(profile, memories, financeData, aiResponse, focusTopic) {
    // If AI generated a personalized response, use it
    if (aiResponse && !aiResponse.includes('high demand')) {
      return aiResponse;
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? '☀️ Good Morning' : hour < 17 ? '🌤️ Good Afternoon' : '🌙 Good Evening';
    const name = escapeHtml(profile.firstName);
    const stories = financeData.raw?.structuredUpdates || [];

    let html = `${greeting}, <b>${name}</b>.\n\n`;

    // Graceful fallback — structured static content from raw data
    html += `<b>Here's what matters today.</b>\n\n`;

    // Personalized priority based on followed companies
    const followedCompanies = (profile.companiesRaw || []).map((c) => c.toLowerCase());
    const priorityStories = stories.filter((s) =>
      (s.symbols || []).some((sym) => followedCompanies.includes(sym.toLowerCase()))
    );
    const otherStories = stories.filter((s) => !priorityStories.includes(s));
    const orderedStories = [...priorityStories, ...otherStories];

    if (orderedStories.length > 0) {
      html += `📈 <b>Market Intelligence</b>\n\n`;
      orderedStories.forEach((story, i) => {
        const symbols = (story.symbols || []).map((s) => `#${escapeHtml(s)}`).join(' ');
        html += `<b>${i + 1}. ${escapeHtml(story.headline)}</b> ${symbols}\n`;
        html += `${escapeHtml(story.summary)}\n\n`;

        if (story.whyItMatters) {
          html += `💡 <b>Why it matters:</b> ${escapeHtml(story.whyItMatters)}\n\n`;
        }
      });
    } else {
      html += `📊 No critical market developments at this hour.\n\n`;
    }

    // User-specific watchlist
    if (followedCompanies.length > 0) {
      html += `🎯 <b>Your Watchlist</b>\n`;
      html += followedCompanies.slice(0, 5).map((c) => `• ${escapeHtml(c.toUpperCase())}`).join('\n');
      html += `\n\n`;
    }

    // Memory-driven personalization
    const finMemories = memories.filter((m) => m.category === 'FINANCE' || m.category === 'INTEREST');
    if (finMemories.length > 0) {
      html += `🧠 <b>Based on your interests</b>\n`;
      html += finMemories.slice(0, 3).map((m) => `• ${escapeHtml(m.fact)}`).join('\n');
      html += `\n\n`;
    }

    html += `📅 <i>Type /brief anytime for an on-demand update.</i>`;
    return html;
  }

  static _formatEveningSummary(profile, messageCount, aiSummary) {
    if (aiSummary && !aiSummary.includes('high demand')) {
      return aiSummary;
    }

    const name = escapeHtml(profile.firstName);
    let html = `🌙 <b>Evening Recap</b> — ${name}\n\n`;

    // Fallback
    html += `Today's activity: <b>${messageCount}</b> messages exchanged.\n\n`;
    if (messageCount === 0) {
      html += `No conversations today — I'll be here when you need me!\n\n`;
    } else {
      html += `You had an active day. I've stored any new preferences for future personalization.\n\n`;
    }
    html += `💤 Rest well. See you tomorrow!`;
    return html;
  }

  static _formatWeeklyDigest(profile, messageCount, memories, financeData, aiDigest) {
    if (aiDigest && !aiDigest.includes('high demand')) {
      return aiDigest;
    }

    const name = escapeHtml(profile.firstName);
    let html = `📋 <b>Weekly Intelligence Digest</b> — ${name}\n\n`;

    // Fallback
    html += `<b>📊 Week in Numbers</b>\n`;
    html += `• Messages: ${messageCount}\n`;
    html += `• Memories stored: ${memories.length}\n\n`;

    const overview = financeData.raw?.summaryText;
    if (overview) {
      html += `<b>📈 Market Snapshot</b>\n${escapeHtml(overview)}\n\n`;
    }

    html += `<i>See you next week! Type /brief for real-time updates.</i>`;
    return html;
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — Graceful Fallbacks (no AI required)
  // ═══════════════════════════════════════════════════════════

  static _fallbackMorningBrief(telegramId) {
    return `☀️ <b>Good Morning!</b>\n\nYour personalized briefing is temporarily unavailable.\n\n📊 Type /brief to try again, or ask me anything directly.\n\n<i>Atlas AI — Your Intelligence Companion</i>`;
  }

  static _fallbackEveningSummary() {
    return `🌙 <b>Evening Recap</b>\n\nSummary generation is temporarily unavailable.\n\n<i>See you tomorrow!</i>`;
  }

  static _fallbackWeeklyDigest() {
    return `📋 <b>Weekly Digest</b>\n\nDigest generation is temporarily unavailable.\n\n<i>Type /brief for the latest updates.</i>`;
  }

  // ═══════════════════════════════════════════════════════════
  // PRIVATE — Utility
  // ═══════════════════════════════════════════════════════════

  static _extractProfile(user) {
    const prefs = user?.preferences || {};
    return {
      firstName: user?.firstName || 'there',
      profession: prefs.profession || 'Professional',
      industries: prefs.industries?.length ? prefs.industries.join(', ') : 'General',
      topics: prefs.topics?.length ? prefs.topics.join(', ') : 'General',
      companies: prefs.companies?.length ? prefs.companies.join(', ') : 'None specified',
      companiesRaw: prefs.companies || [],
    };
  }

  /**
   * Maps user focus topics to stock symbols for FinanceService
   */
  static _topicToSymbol(topic) {
    if (!topic) return null;
    const map = {
      nvidia: 'NVDA', tesla: 'TSLA', apple: 'AAPL', microsoft: 'MSFT',
      google: 'GOOGL', amazon: 'AMZN', meta: 'META', netflix: 'NFLX',
    };
    return map[topic.toLowerCase()] || null;
  }
}
