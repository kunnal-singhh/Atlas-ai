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

        if (!response || !response.text) {
          throw new Error('Empty response received from Gemini API');
        }

        return response.text;
      } catch (error) {
        const isQuotaExceeded = error.status === 429;

        if (isQuotaExceeded) {
          logger.warn(`Gemini API Quota Exceeded (Attempt ${attempt}/${maxRetries}): ${error.message}`);
          
          if (attempt === maxRetries) {
            return "We are currently experiencing high demand. Please try again in a moment.";
          }
        } else {
          logger.warn(`Gemini API call failed (Attempt ${attempt}/${maxRetries}): ${error.message}`);

          if (attempt === maxRetries) {
            logger.error('Gemini API retries exhausted:', { error: error.message, stack: error.stack });
            throw error;
          }
        }

        let waitTime = delay;

        if (isQuotaExceeded) {
          // Attempt to extract Retry-After header if available
          let retryAfter = null;
          if (error.response && typeof error.response.headers?.get === 'function') {
             retryAfter = error.response.headers.get('retry-after');
          }
          
          if (retryAfter && !isNaN(parseInt(retryAfter, 10))) {
            waitTime = parseInt(retryAfter, 10) * 1000;
          }
        }

        // Add exponential backoff with jitter (prevent immediate repeated retries on 429)
        const jitter = Math.floor(Math.random() * 1000);
        await new Promise((resolve) => setTimeout(resolve, waitTime + jitter));
        
        delay *= 2;
      }
    }
  }
}
