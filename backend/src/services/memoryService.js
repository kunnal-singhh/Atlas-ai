import { Memory } from '../models/Memory.js';
import { MemoryScorer } from './memoryScorer.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class MemoryService {
  /**
   * Creates or updates a memory record, avoiding duplicates
   */
  static async saveMemory(telegramId, { fact, category, importanceScore, keywords, sourceConversationId }) {
    try {
      if (!fact || fact.trim().length < 3) return null;

      // Check for existing similar memory (basic deduplication by keyword overlay/fact prefix)
      const existingMemories = await Memory.find({ telegramId, category }).lean();
      const duplicate = existingMemories.find(
        (m) => m.fact.toLowerCase() === fact.toLowerCase().trim()
      );

      if (duplicate) {
        // Update existing record timestamp and bump importance if higher
        return await Memory.findByIdAndUpdate(
          duplicate._id,
          {
            $set: {
              lastAccessedAt: new Date(),
              importanceScore: Math.max(duplicate.importanceScore, importanceScore || 5),
            },
            $addToSet: { keywords: { $each: keywords || [] } },
          },
          { new: true }
        );
      }

      // Create new memory record
      return await Memory.create({
        telegramId,
        fact: fact.trim(),
        category: category || 'GENERAL',
        importanceScore: importanceScore || 5,
        keywords: keywords || [],
        sourceConversationId: sourceConversationId || null,
        lastAccessedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error saving memory:', { error: error.message, telegramId });
      return null;
    }
  }

  /**
   * Retrieves top relevant memories based on query text without throwing on DB errors
   */
  static async getRelevantMemories(telegramId, userQueryText = '', limit = config.maxRetrievedMemories) {
    try {
      const allMemories = await Memory.find({
        telegramId,
        importanceScore: { $gte: config.minImportanceScoreThreshold },
      }).lean();

      if (!allMemories.length) {
        return [];
      }

      // Extract raw words as query keywords
      const queryKeywords = userQueryText
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter((word) => word.length > 3);

      const ranked = MemoryScorer.rankMemories(allMemories, queryKeywords);
      const topMemories = ranked.slice(0, limit);

      // Touch lastAccessedAt asynchronously
      const memoryIds = topMemories.map((m) => m._id);
      if (memoryIds.length) {
        Memory.updateMany({ _id: { $in: memoryIds } }, { $set: { lastAccessedAt: new Date() } }).catch((err) =>
          logger.warn('Failed to update lastAccessedAt for memories:', { error: err.message })
        );
      }

      return topMemories;
    } catch (error) {
      logger.error('Memory retrieval failed gracefully:', { error: error.message, telegramId });
      return []; // Return empty array so system continues unhindered
    }
  }

  /**
   * Delete a specific memory entry
   */
  static async deleteMemory(memoryId, telegramId) {
    return await Memory.deleteOne({ _id: memoryId, telegramId });
  }

  /**
   * Prunes low-importance memories if user exceeds soft memory cap
   */
  static async pruneLowValueMemories(telegramId, maxCap = 100) {
    try {
      const count = await Memory.countDocuments({ telegramId });
      if (count > maxCap) {
        const excess = count - maxCap;
        const lowest = await Memory.find({ telegramId })
          .sort({ importanceScore: 1, lastAccessedAt: 1 })
          .limit(excess)
          .select('_id');

        const idsToDelete = lowest.map((doc) => doc._id);
        await Memory.deleteMany({ _id: { $in: idsToDelete } });
      }
    } catch (error) {
      logger.error('Memory pruning error:', { error: error.message, telegramId });
    }
  }
}