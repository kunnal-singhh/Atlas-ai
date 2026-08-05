import { toolRegistry } from './toolRegistry.js';
import { financeService } from '../financeService.js';
import logger from '../../utils/logger.js';

/**
 * Finance Tool
 * Retrieves financial intelligence including news, summaries, and stock data.
 * Reuses the existing FinanceService pipeline.
 */
const financeTool = {
  name: 'finance',
  description: 'Retrieves real-time market updates, financial briefings, stock news, or specific ticker earnings.',
  category: 'data_retrieval',
  priority: 70,
  keywords: [
    'stock', 'market', 'finance', 'financial', 'earnings', 'business',
    'investing', 'invest', 'portfolio', 'dividend', 'ticker', 'wall street',
    'tesla', 'apple', 'microsoft', 'nvidia', 'amazon', 'google', 'meta', 'netflix'
  ],
  patterns: [
    /\$([a-zA-Z]{1,5})\b/, // Explicit ticker focus e.g. $NVDA
    /how is the market/i,
    /market summary/i,
    /business news/i
  ],
  execute: async (telegramId, userMessage, context) => {
    logger.info(`[FinanceTool] Executing financial lookup for telegramId: ${telegramId}`);
    try {
      const symbol = extractSymbol(userMessage);
      logger.info(`[FinanceTool] Extracted symbol: ${symbol || 'General'}`);
      
      const { raw, formatted } = await financeService.getFinancialBriefing(telegramId, { symbol });
      
      return {
        type: 'finance',
        result: {
          symbol: symbol || 'General',
          raw,
          formatted
        }
      };
    } catch (error) {
      logger.error('[FinanceTool] Failed to run finance pipeline:', error);
      throw error;
    }
  }
};

/**
 * Relocated from ConversationService to keep finance routing isolated here.
 */
function extractSymbol(text) {
  const lower = text.toLowerCase();
  const companyToTicker = {
    'tesla': 'TSLA',
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'nvidia': 'NVDA',
    'amazon': 'AMZN',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'meta': 'META',
    'facebook': 'META',
    'netflix': 'NFLX'
  };

  // 1. Explicit ticker like $NVDA
  const explicitMatch = text.match(/\$([a-zA-Z]{1,5})\b/);
  if (explicitMatch) return explicitMatch[1].toUpperCase();

  // 2. Company name matching
  for (const [company, ticker] of Object.entries(companyToTicker)) {
    if (lower.includes(company)) return ticker;
  }

  // 3. Implied ticker (e.g. "NVDA news")
  const impliedMatch = text.match(/\b([a-zA-Z]{1,5})\s+(stock|news|earnings)\b/i);
  if (impliedMatch) {
    const potentialTicker = impliedMatch[1].toUpperCase();
    const ignoreWords = ['THE', 'A', 'AN', 'LATEST', 'GOOD', 'BAD', 'SOME', 'ANY', 'THIS'];
    if (!ignoreWords.includes(potentialTicker)) {
      return potentialTicker;
    }
  }

  return null;
}

// Auto-register with central registry
toolRegistry.register(financeTool);

export default financeTool;
export { extractSymbol };
