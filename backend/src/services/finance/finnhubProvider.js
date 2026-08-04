import { NewsProviderInterface } from './newsProviderInterface.js';
import { config } from '../../config/env.js';
import logger from '../../utils/logger.js';

export class FinnhubProvider extends NewsProviderInterface {
  constructor() {
    super();
    this.apiKey = config.finnhubApiKey;
    this.baseUrl = 'https://finnhub.io/api/v1';
  }

  /**
   * Fetches latest news from Finnhub API or fallback market endpoints.
   * @param {Object} options
   * @param {string} [options.category='general']
   * @param {string} [options.symbol]
   * @returns {Promise<Array<import('./newsProviderInterface.js').NormalizedArticle>>}
   */
  async fetchNews({ category = 'general', symbol = null } = {}) {
    if (!this.apiKey) {
      logger.warn('FINNHUB_API_KEY is not set. Returning empty news stream.');
      return [];
    }

    try {
      let endpoint = `${this.baseUrl}/news?category=${category}&token=${this.apiKey}`;
      
      if (symbol) {
        const today = new Date().toISOString().split('T')[0];
        const pastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endpoint = `${this.baseUrl}/company-news?symbol=${symbol.toUpperCase()}&from=${pastWeek}&to=${today}&token=${this.apiKey}`;
      }

      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000), // 8 second network timeout
      });

      if (!response.ok) {
        logger.error(`Finnhub HTTP error: ${response.status} ${response.statusText}`);
        return [];
      }

      const rawArticles = await response.json();
      if (!Array.isArray(rawArticles)) {
        logger.warn('Finnhub returned non-array payload:', rawArticles);
        return [];
      }

      return rawArticles.map((item) => this.normalize(item, symbol));
    } catch (err) {
      logger.error('Failed to fetch financial news from Finnhub:', { error: err.message });
      return [];
    }
  }

  /**
   * Normalizes raw Finnhub article object into standard internal schema
   */
  normalize(raw, requestedSymbol = null) {
    const rawCategory = (raw.category || '').toLowerCase();
    let category = 'GENERAL';

    if (rawCategory.includes('top') || rawCategory.includes('market')) category = 'MARKETS';
    else if (rawCategory.includes('technology') || rawCategory.includes('tech')) category = 'TECH';
    else if (rawCategory.includes('crypto')) category = 'CRYPTO';
    else if (requestedSymbol) category = 'EARNINGS';

    const symbols = [];
    if (requestedSymbol) {
      symbols.push(requestedSymbol.toUpperCase());
    } else if (raw.related) {
      symbols.push(...raw.related.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean));
    }

    return {
      articleId: `finnhub_${raw.id || Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      provider: 'finnhub',
      title: raw.headline || 'Untitled Market News',
      summary: raw.summary || '',
      source: raw.source || 'Financial Market News',
      publishedAt: raw.datetime ? new Date(raw.datetime * 1000) : new Date(),
      company: requestedSymbol ? requestedSymbol.toUpperCase() : (symbols[0] || null),
      symbols: Array.from(new Set(symbols)),
      category,
      url: raw.url || 'https://finnhub.io',
    };
  }
}