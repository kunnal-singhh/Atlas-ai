import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { GeminiService } from './geminiService.js';
import { ContextBuilder } from './contextBuilder.js';
import { FormatterService } from './formatterService.js';
import { MemoryExtractor } from './memoryExtractor.js';
import { TokenManager } from './tokenManager.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class ConversationService {
  constructor() {
    this.geminiService = new GeminiService();
    this.memoryExtractor = new MemoryExtractor();
  }

  /**
   * Processes incoming user prompt with memory retrieval, context building, 
   * Gemini response generation, and background fact extraction.
   * 
   * @param {number} telegramId 
   * @param {string} userMessageText 
   * @returns {Promise<Array<string>>} Array of formatted message chunks for Telegram
   */
  async processUserMessage(telegramId, userMessageText) {
    // 1. Resolve User profile
    const user = await User.findOne({ telegramId });

    // 2. Fetch recent short-term conversation history
    const rawHistory = await Message.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(config.maxRecentMessages || 10)
      .lean();

    // 3. Assemble full prompt context (System Prompt + Profile + Memories + History + Input)
    const { systemInstruction, contents } = await ContextBuilder.buildContext({
      user,
      telegramId,
      currentMessageText: userMessageText,
      rawHistory,
    });

    // 4. Generate Response from Gemini API
    const rawResponse = await this.geminiService.generateResponse({
      systemInstruction,
      contents,
    });

    // 5. Convert raw response (markdown) to Telegram HTML, then format & chunk
    const htmlText = FormatterService.markdownToHtml(rawResponse);
    const formattedText = FormatterService.formatForTelegram(htmlText);
    const responseChunks = FormatterService.chunkMessage(formattedText);

    // 6. Persist Raw (Plain Markdown) Response Turn to MongoDB
    await this.persistTurn(telegramId, user?._id, userMessageText, rawResponse);

    // 7. Trigger Non-Blocking Background Memory Extraction
    // Uses setImmediate so user response is delivered immediately without waiting for extraction
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
  async persistTurn(telegramId, userId, userText, modelText) {
    try {
      await Message.create([
        {
          telegramId,
          userId,
          role: 'user',
          content: userText,
          tokensCount: TokenManager.estimateTokens(userText),
        },
        {
          telegramId,
          userId,
          role: 'model',
          content: modelText,
          tokensCount: TokenManager.estimateTokens(modelText),
        },
      ]);
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

// Export singleton instance for app-wide use
export const conversationService = new ConversationService();