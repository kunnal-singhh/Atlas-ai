import { Memory } from '../models/Memory.js';
import { MemoryScorer } from './memoryScorer.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class MemoryService {
  /**
   * Creates or updates a memory record, avoiding duplicates
   */
  static async saveMemory(telegramId, { fact, category, importanceScore, keywords, structuredData = {}, sourceConversationId }) {
    try {
      if (!fact || fact.trim().length < 3) return null;

      // 1. Semantic Deduplication via structuredData (e.g. matching "NVIDIA" and "company_interest")
      const existingMemories = await Memory.find({ telegramId, category }).lean();
      
      let duplicate = null;

      // First try semantic match if structured data exists
      if (structuredData && structuredData.entity) {
        duplicate = existingMemories.find(m => 
          m.structuredData && 
          m.structuredData.entity && 
          m.structuredData.entity.toLowerCase() === structuredData.entity.toLowerCase() &&
          m.structuredData.type === structuredData.type
        );
      }
      
      // Fallback to basic string match if no semantic match
      if (!duplicate) {
        duplicate = existingMemories.find(
          (m) => m.fact.toLowerCase() === fact.toLowerCase().trim()
        );
      }

      if (duplicate) {
        // Semantic match found: Merge data rather than duplicating
        return await Memory.findByIdAndUpdate(
          duplicate._id,
          {
            $set: {
              lastAccessedAt: new Date(),
              importanceScore: Math.max(duplicate.importanceScore, importanceScore || 5),
              // Optional: We could update the 'fact' string here to the newer phrasing, 
              // but bumping importance and keywords is sufficient for merging.
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
        category: category || 'INTEREST', // Default to INTEREST now that GENERAL is removed
        structuredData,
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
   * Cleans up garbage memories matching invalid patterns
   */
  static async cleanupInvalidMemories(telegramId = null) {
    try {
      const query = {
        $or: [
          { category: 'GENERAL' },
          { fact: { $regex: /^user mentioned/i } },
          { fact: { $regex: /\?$/ } },
          { fact: { $regex: /^(what|who|why|how|explain|tell me|hello|hi|thanks)\b/i } }
        ]
      };

      if (telegramId) {
        query.telegramId = telegramId;
      }

      const totalBefore = await Memory.countDocuments(telegramId ? { telegramId } : {});
      const result = await Memory.deleteMany(query);
      const totalAfter = await Memory.countDocuments(telegramId ? { telegramId } : {});

      return {
        deleted: result.deletedCount,
        remaining: totalAfter,
        totalBefore
      };
    } catch (error) {
      logger.error('Error cleaning up invalid memories:', error);
      return { deleted: 0, error: error.message };
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