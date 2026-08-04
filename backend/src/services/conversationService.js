import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { aiService } from './aiService.js';
import { ContextBuilder } from './contextBuilder.js';
import { FormatterService } from './formatterService.js';
import { MemoryExtractor } from './memoryExtractor.js';
import { TokenManager } from './tokenManager.js';
import { financeService } from './financeService.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class ConversationService {
  constructor() {
    this.aiService = aiService;
    this.memoryExtractor = new MemoryExtractor();
  }

  /**
   * Detects if user query has direct financial intelligence intent
   */
  isFinanceIntent(text) {
    const lower = text.toLowerCase();
    
    // Explicit ticker
    if (/\$([a-zA-Z]{1,5})\b/.test(text)) return true;

    const financeKeywords = [
      'market', 'stock', 'finance', 'financial', 'earnings', 'business',
      'investing', 'invest', 'portfolio', 'dividend', 'ticker', 'wall street'
    ];
    const newsKeywords = [
      'news', 'update', 'updates', 'happened', 'summary', 'brief', 'latest', 'today'
    ];
    
    const hasFinanceContext = financeKeywords.some(kw => lower.includes(kw));
    const hasNewsContext = newsKeywords.some(kw => lower.includes(kw));
    
    if (hasFinanceContext && hasNewsContext) return true;
    
    const companies = ['tesla', 'apple', 'microsoft', 'nvidia', 'amazon', 'google', 'meta', 'netflix'];
    const hasCompany = companies.some(c => lower.includes(c));
    if (hasCompany && (hasNewsContext || hasFinanceContext)) return true;

    const exactTriggers = ['how is the market', 'market summary', 'business news'];
    if (exactTriggers.some(t => lower.includes(t))) return true;

    return false;
  }

  /**
   * Extracts stock symbol ticker if present in prompt
   */
  extractSymbol(text) {
    const lower = text.toLowerCase();
    const companyToTicker = {
      'tesla': 'TSLA',
      'apple': 'AAPL',
      'microsoft': 'MSFT',
      'nvidia': 'NVDA',
      'amazon': 'AMZN',
      'google': 'GOOGL',
      'alphabet': 'GOOGL',
      'meta': 'META',
      'facebook': 'META',
      'netflix': 'NFLX'
    };

    // 1. Explicit ticker like $NVDA
    const explicitMatch = text.match(/\$([a-zA-Z]{1,5})\b/);
    if (explicitMatch) return explicitMatch[1].toUpperCase();

    // 2. Company name matching
    for (const [company, ticker] of Object.entries(companyToTicker)) {
      if (lower.includes(company)) return ticker;
    }

    // 3. Implied ticker (e.g. "NVDA news")
    const impliedMatch = text.match(/\b([a-zA-Z]{1,5})\s+(stock|news|earnings)\b/i);
    if (impliedMatch) {
      const potentialTicker = impliedMatch[1].toUpperCase();
      const ignoreWords = ['THE', 'A', 'AN', 'LATEST', 'GOOD', 'BAD', 'SOME', 'ANY', 'THIS'];
      if (!ignoreWords.includes(potentialTicker)) {
        return potentialTicker;
      }
    }

    return null;
  }

  /**
   * Processes incoming user prompt with context building, finance routing,
   * Gemini response generation, and background memory extraction.
   * 
   * @param {number} telegramId 
   * @param {string} userMessageText 
   * @returns {Promise<Array<string>>} Array of formatted message chunks for Telegram
   */
  async processUserMessage(telegramId, userMessageText) {
    // 1. Direct Intent Route: Check if user requested financial intelligence
    if (this.isFinanceIntent(userMessageText)) {
      const symbol = this.extractSymbol(userMessageText);
      logger.info(`Routing user query to Finance Intelligence Engine. Symbol: ${symbol || 'General'}`);
      
      const { raw, formatted } = await financeService.getFinancialBriefing(telegramId, { symbol });
      
      // Persist turn
      await this.persistTurn(telegramId, userMessageText, JSON.stringify(raw));
      
      return [formatted];
    }

    // 2. Standard Context Assembly (Modules 1-7)
    const user = await User.findOne({ telegramId });

    const rawHistory = await Message.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(config.maxRecentMessages || 10)
      .lean();

    const { systemInstruction, contents } = await ContextBuilder.buildContext({
      user,
      telegramId,
      currentMessageText: userMessageText,
      rawHistory,
    });

    // 3. Generate Response from Gemini API
    const rawResponse = await this.aiService.generateResponse({
      systemInstruction,
      contents,
    });

    // 4. Format & Chunk Output
    const formattedText = FormatterService.formatForTelegram(rawResponse);
    const responseChunks = FormatterService.chunkMessage(formattedText);

    // 5. Persist Message Turn
    await this.persistTurn(telegramId, userMessageText, rawResponse);

    // 6. Non-Blocking Background Memory Extraction (Module 7)
    setImmediate(() => {
      this.memoryExtractor.extractAndSave(telegramId, userMessageText).catch((err) => {
        logger.warn('Background memory extraction unhandled rejection:', { error: err.message, telegramId });
      });
    });

    return responseChunks;
  }

  /**
   * Persists user query and model response turn into MongoDB
   */
  async persistTurn(telegramId, userText, modelText) {
    try {
      const user = await User.findOne({ telegramId });
      const conversation = await Conversation.findOne({ telegramId, isActive: true }).sort({ createdAt: -1 });

      const userId = user ? user._id : undefined;
      const conversationId = conversation ? conversation._id : undefined;

      const userMessage = {
        telegramId,
        role: 'user',
        content: userText,
        tokensCount: TokenManager.estimateTokens(userText),
      };
      const modelMessage = {
        telegramId,
        role: 'model',
        content: modelText,
        tokensCount: TokenManager.estimateTokens(modelText),
      };

      if (userId) {
        userMessage.userId = userId;
        modelMessage.userId = userId;
      }
      if (conversationId) {
        userMessage.conversationId = conversationId;
        modelMessage.conversationId = conversationId;
      }

      await Message.create([userMessage, modelMessage]);
    } catch (err) {
      logger.error('Failed to persist conversation history turn:', { error: err.message, telegramId });
    }
  }

  /**
   * Helper to fetch active conversation history for REST/Web API routes
   */
  async getHistory(telegramId, limit = 10) {
    const messages = await Message.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return messages.reverse();
  }
}

export const conversationService = new ConversationService();