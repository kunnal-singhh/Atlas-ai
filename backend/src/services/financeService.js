import { Article } from '../models/Article.js';
import { Memory } from '../models/Memory.js';
import { FinnhubProvider } from './finance/finnhubProvider.js';
import { Deduplicator } from './finance/deduplicator.js';
import { ImportanceRanker } from './finance/importanceRanker.js';
import { AISummarizer } from './finance/aiSummarizer.js';
import { FinanceFormatter } from './finance/financeFormatter.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

export class FinanceService {
  constructor() {
    this.newsProvider = new FinnhubProvider();
    this.aiSummarizer = new AISummarizer();
  }

  /**
   * Main pipeline method to generate personalized financial intelligence
   * 
   * @param {number} telegramId
   * @param {Object} options
   * @param {string} [options.symbol] Optional stock ticker focus (e.g., "NVDA")
   * @param {string} [options.category='general'] News category
   * @returns {Promise<{raw: Object, formatted: string}>} Raw intelligence and Formatted Telegram HTML string
   */
  async getFinancialBriefing(telegramId, { symbol = null, category = 'general' } = {}) {
    try {
      // 1. Fetch cached articles or hit API
      let rawArticles = await this.getOrFetchArticles({ symbol, category });

      if (rawArticles.length === 0) {
        const fallbackMsg = `No recent news stories found${symbol ? ` for ${symbol.toUpperCase()}` : ''}. Please check back shortly.`;
        return {
          raw: { summaryText: fallbackMsg, structuredUpdates: [] },
          formatted: `<b>📊 Market Briefing</b>\n\n${fallbackMsg}`
        };
      }

      // 2. Remove duplicates
      const uniqueArticles = Deduplicator.deduplicate(rawArticles);

      // 3. Fetch Module 7 User Memories for Personalization
      const userMemories = await Memory.find({
        telegramId,
        category: { $in: ['FINANCE', 'INTEREST', 'WORK'] },
      }).lean();

      // 4. Rank articles by importance + user interest alignment
      const rankedArticles = ImportanceRanker.rank(uniqueArticles, userMemories);

      // Take top 3 articles for synthesis
      const topArticles = rankedArticles.slice(0, 3);

      // 5. Generate AI Summary & "Why It Matters" via Gemini
      const intelligence = await this.aiSummarizer.summarizeMarketNews(
        topArticles,
        symbol || null
      );

      // 6. Format into Telegram HTML
      const formatted = FinanceFormatter.formatTelegramReport(intelligence);
      return { raw: intelligence, formatted };
    } catch (err) {
      logger.error('Error executing Finance Service pipeline:', { error: err.message, telegramId });
      const errorMsg = 'Unable to generate market update at this moment. Please try again later.';
      return {
        raw: { summaryText: errorMsg, structuredUpdates: [] },
        formatted: `<b>⚠️ Finance Intelligence Error</b>\n\n${errorMsg}`
      };
    }
  }

  /**
   * Retrieves fresh articles from cache or fetches from provider if cache is expired
   */
  async getOrFetchArticles({ symbol, category }) {
    const cacheTtlMs = config.financeCacheTtlMinutes * 60 * 1000;
    const cutoffDate = new Date(Date.now() - cacheTtlMs);

    const query = { retrievedAt: { $gte: cutoffDate } };
    if (symbol) {
      query.symbols = symbol.toUpperCase();
    }

    // Check DB cache first
    let cached = await Article.find(query).sort({ publishedAt: -1 }).limit(20).lean();

    if (cached && cached.length >= 3) {
      logger.info(`Finance Cache Hit: Loaded ${cached.length} articles from DB.`);
      return cached;
    }

    // Cache Miss -> Fetch fresh articles from provider
    logger.info(`Finance Cache Miss: Fetching fresh articles from provider...`);
    const fetchedArticles = await this.newsProvider.fetchNews({ category, symbol });

    if (fetchedArticles.length === 0) {
      return cached || [];
    }

    // Bulk save/upsert normalized articles into MongoDB
    const bulkOps = fetchedArticles.map((article) => {
      const fingerprint = Deduplicator.generateFingerprint(article.title);
      return {
        updateOne: {
          filter: { articleId: article.articleId },
          update: { $set: { ...article, fingerprint, retrievedAt: new Date() } },
          upsert: true,
        },
      };
    });

    await Article.bulkWrite(bulkOps).catch((err) => {
      logger.warn('Non-fatal error caching articles to MongoDB:', { error: err.message });
    });

    return fetchedArticles;
  }
}

export const financeService = new FinanceService();