import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { GeminiService } from './geminiService.js';
import { PromptManager } from './promptManager.js';
import { TokenManager } from './tokenManager.js';
import { FormatterService } from './formatterService.js';
import logger from '../utils/logger.js';

// --- Standalone Functions for Session Management and Logging ---

export const getOrCreateActiveConversation = async (userId, telegramId) => {
  let conversation = await Conversation.findOne({ userId, isActive: true });

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      telegramId,
      title: 'Active Session'
    });
  }

  return conversation;
};

export const logMessage = async ({ conversationId, userId, telegramMessageId, sender, text, metadata = {} }) => {
  // Resolve telegramId dynamically from User or Conversation to satisfy Message schema requirements
  let telegramId = null;
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      telegramId = user.telegramId;
    }
  }

  if (!telegramId && conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      telegramId = String(conversation.telegramId);
    }
  }

  const message = await Message.create({
    telegramId: telegramId || '0',
    conversationId,
    userId,
    telegramMessageId,
    role: sender || 'user',
    content: text || '',
    tokensCount: TokenManager.estimateTokens(text),
    metadata
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    $inc: { messageCount: 1 }
  });

  return message;
};

// --- ConversationService Class for AI Conversation Engine ---

export class ConversationService {
  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Processes incoming user prompt, calls Gemini with context, formats response, and logs turn
   */
  async processUserMessage(telegramId, userMessageText) {
    // 1. Fetch User details for System Prompt personalization
    const user = await User.findOne({ telegramId });

    // 2. Retrieve recent short-term conversation history (last 10 turns)
    const rawHistory = await Message.find({ telegramId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Reorder history chronologically
    const chronologicalHistory = rawHistory.reverse().map((msg) => ({
      role: msg.role === 'bot' ? 'model' : msg.role, // normalize roles for Gemini API
      content: msg.content,
    }));

    // 3. Prune history to respect token budget
    const prunedHistory = TokenManager.pruneHistory(chronologicalHistory, 3000);

    // 4. Construct System Instruction Prompt
    const systemInstruction = PromptManager.buildSystemPrompt(user);

    // 5. Format payload array for Gemini SDK API expectations
    const contents = prunedHistory.map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user', // force standard roles for Gemini
      parts: [{ text: msg.content }],
    }));

    // Append current user turn
    contents.push({
      role: 'user',
      parts: [{ text: userMessageText }],
    });

    // 6. Generate Response from Gemini API
    const rawResponse = await this.geminiService.generateResponse({
      systemInstruction,
      contents,
    });

    // 7. Format & Chunk Output
    const formattedText = FormatterService.formatForTelegram(rawResponse);
    const responseChunks = FormatterService.chunkMessage(formattedText);

    // 8. Persist User Message and AI Response to MongoDB asynchronously
    await this.persistTurn(telegramId, userMessageText, formattedText, user);

    return responseChunks;
  }

  /**
   * Persists message turns into MongoDB
   */
  async persistTurn(telegramId, userText, modelText, user) {
    try {
      // Find active conversation to link message if possible
      let conversationId = undefined;
      let userId = undefined;
      if (user) {
        userId = user._id;
        const conversation = await getOrCreateActiveConversation(userId, telegramId);
        if (conversation) {
          conversationId = conversation._id;
        }
      }

      await Message.create([
        {
          telegramId,
          conversationId,
          userId,
          role: 'user',
          content: userText,
          tokensCount: TokenManager.estimateTokens(userText),
        },
        {
          telegramId,
          conversationId,
          userId,
          role: 'model',
          content: modelText,
          tokensCount: TokenManager.estimateTokens(modelText),
        },
      ]);

      if (conversationId) {
        await Conversation.findByIdAndUpdate(conversationId, {
          $inc: { messageCount: 2 }
        });
      }
    } catch (err) {
      logger.error('Failed to persist conversation history turn:', { error: err.message });
    }
  }
}