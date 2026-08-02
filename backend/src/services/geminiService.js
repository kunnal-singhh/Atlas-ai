import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class GeminiService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    this.modelName = 'gemini-2.5-flash';
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
        logger.warn(`Gemini API call failed (Attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt === maxRetries) {
          logger.error('Gemini API retries exhausted:', { error: error.message, stack: error.stack });
          throw error;
        }

        // Wait with exponential backoff before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
}
