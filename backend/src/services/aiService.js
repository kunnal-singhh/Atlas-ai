import { GeminiService } from './geminiService.js';
import { MockAIProvider } from './ai/mockAIProvider.js';
import logger from '../utils/logger.js';

/**
 * AIService — Unified AI provider gateway.
 * 
 * Routes all AI requests to either GeminiService or MockAIProvider
 * based on the AI_PROVIDER environment variable.
 * 
 * Usage:
 *   AI_PROVIDER=mock   → Uses MockAIProvider (no API calls)
 *   AI_PROVIDER=gemini → Uses GeminiService (production)
 *   (unset)            → Defaults to GeminiService
 * 
 * All consumers import { aiService } and call aiService.generateResponse().
 * No consumer needs to know which provider is active.
 */
class AIService {
  constructor() {
    const provider = process.env.AI_PROVIDER || 'gemini';
    this.activeProvider = provider;

    if (provider === 'mock') {
      this.provider = new MockAIProvider();
      logger.info('🔧 AIService initialized with MockAIProvider (development mode)');
    } else {
      this.provider = new GeminiService();
      logger.info('🚀 AIService initialized with GeminiService (production mode)');
    }
  }

  /**
   * Generates content using the active AI provider.
   * @param {Object} params
   * @param {string} params.systemInstruction
   * @param {Array} params.contents - Formatted array of { role, parts: [{ text }] }
   * @param {Object} [params.config] - Optional config (responseMimeType, temperature, etc.)
   * @returns {Promise<string>} AI-generated response text
   */
  async generateResponse({ systemInstruction, contents, config }) {
    return await this.provider.generateResponse({ systemInstruction, contents, config });
  }
}

export const aiService = new AIService();
