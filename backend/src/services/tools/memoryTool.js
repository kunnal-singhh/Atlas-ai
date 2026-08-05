import { toolRegistry } from './toolRegistry.js';
import { MemoryService } from '../memoryService.js';
import logger from '../../utils/logger.js';

/**
 * Memory Tool
 * Retrieves user memories stored in MongoDB and ranks them by relevance to the query.
 */
const memoryTool = {
  name: 'memory',
  description: 'Retrieves relevant memories, facts, interests, and preferences about the user.',
  category: 'user_data',
  priority: 80,
  keywords: [
    'remember', 'know about me', 'my interests', 'what do i like',
    'my companies', 'companies i follow', 'do i follow', 'my stocks',
    'who am i', 'what do you know'
  ],
  patterns: [
    /what (?:do you|do u|companies|stocks) (?:know|remember|follow|like) (?:about me|about us|i follow|i)/i,
    /do you remember (?:anything|me)/i,
    /show (?:my )?memories/i
  ],
  execute: async (telegramId, userMessage, context) => {
    logger.info(`[MemoryTool] Executing memory retrieval for telegramId: ${telegramId}`);
    try {
      // Get all relevant memories based on the user prompt
      const memories = await MemoryService.getRelevantMemories(telegramId, userMessage);
      
      // Group by category to help with formatting
      const categories = {};
      memories.forEach(m => {
        if (!categories[m.category]) {
          categories[m.category] = [];
        }
        categories[m.category].push(m.fact);
      });

      return {
        type: 'memory',
        result: {
          memories,
          categories
        }
      };
    } catch (error) {
      logger.error('[MemoryTool] Failed to retrieve memories:', error);
      throw error;
    }
  }
};

// Auto-register with the central registry
toolRegistry.register(memoryTool);

export default memoryTool;
