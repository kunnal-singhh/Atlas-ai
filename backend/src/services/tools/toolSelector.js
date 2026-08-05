import { toolRegistry } from './toolRegistry.js';
import logger from '../../utils/logger.js';

/**
 * ToolSelector — Confidence-based intent classifier.
 * 
 * Scores every registered tool against the user message using:
 * 1. Regex pattern matching (high confidence boost)
 * 2. Keyword density scoring (proportional to matches)
 * 3. Tool priority weighting
 * 
 * Returns one or more tools when multiple intents are detected
 * (e.g., "NVIDIA news today" → finance + liveSearch).
 * 
 * Confidence thresholds:
 * - PRIMARY_THRESHOLD (0.55): Minimum score to be selected (requires pattern OR 2+ keywords)
 * - MULTI_TOOL_THRESHOLD (0.4): Secondary tools above this also execute
 */
const PRIMARY_THRESHOLD = 0.55;
const MULTI_TOOL_THRESHOLD = 0.4;

export class ToolSelector {
  /**
   * Scores all registered tools against the user message.
   * @param {string} userMessage 
   * @returns {{ name: string, confidence: number }[]} Sorted descending by confidence
   */
  static scoreTools(userMessage) {
    const lower = userMessage.toLowerCase().trim();
    const tools = toolRegistry.getAllTools();
    const scores = [];

    for (const tool of tools) {
      let confidence = 0;
      let hasMatch = false;

      // 1. Pattern matching — high-confidence regex hits (0.6 boost)
      for (const pattern of tool.patterns) {
        if (pattern.test(lower)) {
          confidence += 0.6;
          hasMatch = true;
          break; // One pattern match is enough for the boost
        }
      }

      // 2. Keyword density scoring — only whole-word matches, proportional scoring
      if (tool.keywords.length > 0) {
        const matchedKeywords = tool.keywords.filter((kw) => {
          // Escape special regex chars in keyword before building pattern
          const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          return regex.test(lower);
        });

        if (matchedKeywords.length > 0) {
          hasMatch = true;
          // Proportional scoring: 0.2 per keyword match, capped at 0.6
          confidence += Math.min(matchedKeywords.length * 0.2, 0.6);
        }
      }

      // 3. Priority weighting (applied only if a real match occurred, as a tie-breaker)
      if (hasMatch) {
        confidence += tool.priority * 0.001;
        scores.push({ name: tool.name, confidence: Math.round(confidence * 100) / 100 });
      }
    }

    return scores.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Selects the best tool(s) for a given user message.
   * Supports multi-tool selection when multiple intents are strong.
   * 
   * @param {string} userMessage 
   * @returns {{ primary: string|null, secondary: string[], scores: Object[] }}
   */
  static selectTools(userMessage) {
    const scores = ToolSelector.scoreTools(userMessage);

    if (scores.length === 0) {
      logger.info('[ToolSelector] No tool matched — routing to AI only');
      return { primary: null, secondary: [], scores: [] };
    }

    const primary = scores[0].confidence >= PRIMARY_THRESHOLD ? scores[0].name : null;
    const secondary = [];

    // Check for secondary tools that also score above the multi-tool threshold
    if (primary) {
      for (let i = 1; i < scores.length; i++) {
        if (scores[i].confidence >= MULTI_TOOL_THRESHOLD) {
          secondary.push(scores[i].name);
        }
      }
    }

    logger.info(`[ToolSelector] Selected: primary=${primary || 'AI_ONLY'}, secondary=[${secondary.join(',')}]`, {
      scores: scores.slice(0, 4),
    });

    return { primary, secondary, scores };
  }
}
