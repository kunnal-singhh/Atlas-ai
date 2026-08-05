import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { aiService } from './aiService.js';
import { ContextBuilder } from './contextBuilder.js';
import { FormatterService } from './formatterService.js';
import { MemoryExtractor } from './memoryExtractor.js';
import { TokenManager } from './tokenManager.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

// Import tools to trigger auto-registration in ToolRegistry
import './tools/memoryTool.js';
import './tools/financeTool.js';
import './tools/liveSearchTool.js';
import './tools/profileTool.js';

import { ToolSelector } from './tools/toolSelector.js';
import { ToolExecutor } from './tools/toolExecutor.js';

export class ConversationService {
  constructor() {
    this.aiService = aiService;
    this.memoryExtractor = new MemoryExtractor();
  }

  /**
   * Processes incoming user prompt with context building, dynamic tool calling,
   * Gemini response generation, and background memory extraction.
   * 
   * @param {number} telegramId 
   * @param {string} userMessageText 
   * @returns {Promise<Array<string>>} Array of formatted message chunks for Telegram
   */
  async processUserMessage(telegramId, userMessageText) {
    logger.info(`[ConversationService] Processing user message from telegramId: ${telegramId}`);

    // 1. Run Tool Selection (Confidence-based + Multi-tool intent detection)
    const { primary, secondary } = ToolSelector.selectTools(userMessageText);

    // 2. Fetch User & Profile context
    const user = await User.findOne({ telegramId });

    // 3. Execute selected tools
    let toolOutputs = [];
    if (primary) {
      try {
        const executionResult = await ToolExecutor.execute(
          primary,
          secondary,
          telegramId,
          userMessageText,
          { user }
        );
        toolOutputs = executionResult.results;
      } catch (err) {
        logger.error(`[ConversationService] Tool execution failed: ${err.message}`);
      }
    }

    // 4. Retrieve conversation history
    const rawHistory = await Message.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(config.maxRecentMessages || 10)
      .lean();

    // 5. Assemble Context Prompt (with User profile, memories, and tool outputs injected)
    const { systemInstruction, contents } = await ContextBuilder.buildContext({
      user,
      telegramId,
      currentMessageText: userMessageText,
      rawHistory,
      toolOutputs,
    });

    // 6. Generate Response from Gemini AI
    let rawResponse;
    try {
      rawResponse = await this.aiService.generateResponse({
        systemInstruction,
        contents,
      });
    } catch (error) {
      logger.error('[ConversationService] AI generation failed, triggering fallback:', { error: error.message });

      // Fallback: If AI is unavailable, return formatted raw tool data
      if (toolOutputs.length > 0) {
        // Finance tool fallback
        const finance = toolOutputs.find((t) => t.type === 'finance');
        if (finance && finance.success && finance.data?.formatted) {
          logger.info('[ConversationService] Fallback to pre-formatted finance intelligence.');
          rawResponse = finance.data.formatted;
        } 
        // Live search fallback
        else {
          const search = toolOutputs.find((t) => t.type === 'liveSearch');
          if (search && search.success && search.data?.synthesized) {
            logger.info('[ConversationService] Fallback to pre-synthesized search results.');
            rawResponse = search.data.synthesized;
          } else {
            // General tool fallback summary
            logger.info('[ConversationService] Fallback to tool output summaries.');
            rawResponse = toolOutputs
              .filter((t) => t.success)
              .map((t) => t.summary)
              .join('\n\n');
          }
        }
      }

      // If no tools were run or fallback data is empty, throw/bubble or return standard offline text
      if (!rawResponse) {
        rawResponse = "⚠️ I am currently experiencing connection difficulties. Please try again shortly.";
      }
    }

    // 7. Format & Chunk Output
    const formattedText = FormatterService.formatForTelegram(rawResponse);
    const responseChunks = FormatterService.chunkMessage(formattedText);

    // 8. Persist Message Turn
    await this.persistTurn(telegramId, userMessageText, rawResponse);

    // 9. Non-Blocking Background Memory Extraction (Module 7)
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