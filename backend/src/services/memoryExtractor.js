import { aiService } from './aiService.js';
import { MemoryService } from './memoryService.js';
import { MEMORY_EXTRACTION_PROMPT } from '../constants/memory.constants.js';
import logger from '../utils/logger.js';

import { MemoryValidator } from './memoryValidator.js';

export class MemoryExtractor {
  constructor() {
    this.aiService = aiService;
  }

  /**
   * Background task to distill durable user facts from conversation turn
   */
  async extractAndSave(telegramId, userMessageText, sourceConversationId = null) {
    try {
      // Ignore very short inputs or standard command calls
      if (!userMessageText || userMessageText.length < 10 || userMessageText.startsWith('/')) {
        return;
      }

      const responseText = await this.aiService.generateResponse({
        systemInstruction: MEMORY_EXTRACTION_PROMPT,
        contents: [
          {
            role: 'user',
            parts: [{ text: `User message: "${userMessageText}"` }],
          },
        ],
      });

      // Extract JSON payload from Gemini response
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      if (parsed.facts && Array.isArray(parsed.facts)) {
        for (const item of parsed.facts) {
          // Pass through the strict validator
          if (!MemoryValidator.isValid(item)) {
            logger.info(`[MemoryExtractor] Memory rejected by Validator: "${item.fact}"`);
            continue;
          }

          if (item.fact && item.importanceScore >= 3) {
            await MemoryService.saveMemory(telegramId, {
              fact: item.fact,
              category: item.category,
              importanceScore: item.importanceScore,
              keywords: item.keywords,
              structuredData: item.structured || {},
              sourceConversationId,
            });
          }
        }
      }
    } catch (error) {
      // Non-blocking failure log
      logger.warn('Background memory extraction skipped or failed:', { error: error.message, telegramId });
    }
  }
}