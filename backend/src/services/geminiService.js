import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class GeminiService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    this.modelName = config.geminiModel;
  }

  /**
   * Generates content using the official Google Gen AI SDK with retry mechanism
   * @param {Object} params
   * @param {string} params.systemInstruction
   * @param {Array} params.contents - Formatted array of { role, parts: [{ text }] }
   */
  async generateResponse({ systemInstruction, contents }) {
    const maxRetries = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        // response.text can be either a method or a property depending on SDK version
        const text = typeof response.text === 'function' ? response.text() : response.text;

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response received from Gemini API');
        }

        return text;
      } catch (error) {
        const isQuotaExceeded = error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED');

        if (isQuotaExceeded) {
          logger.warn(`Gemini API Quota Exceeded (Attempt ${attempt}/${maxRetries}): ${JSON.stringify(error.errorDetails || error.message)}`);

          if (attempt < maxRetries) {
            // Wait then retry
            let waitTime = delay;
            let retryAfter = null;
            if (error.response && typeof error.response.headers?.get === 'function') {
              retryAfter = error.response.headers.get('retry-after');
            }
            if (retryAfter && !isNaN(parseInt(retryAfter, 10))) {
              waitTime = parseInt(retryAfter, 10) * 1000;
            }
            const jitter = Math.floor(Math.random() * 500);
            await new Promise((resolve) => setTimeout(resolve, waitTime + jitter));
            delay *= 2;
            continue;
          }

          // All retries exhausted on quota — return a graceful user-facing message
          // This is returned as a valid response (not thrown) so it displays in chat
          return "⚠️ I'm experiencing high demand right now. Please try again in a moment.";
        }

        logger.warn(`Gemini API call failed (Attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt === maxRetries) {
          logger.error('Gemini API retries exhausted:', { error: error.message });
          throw error; // Let ConversationService handle general errors
        }

        const jitter = Math.floor(Math.random() * 1000);
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        delay *= 2;
      }
    }
  }
}
