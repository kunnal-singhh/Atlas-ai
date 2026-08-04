/**
 * Abstract News Provider Interface
 * Every financial news provider plugin must implement this interface.
 */
export class NewsProviderInterface {
  /**
   * Fetches latest market news or company-specific news.
   * @param {Object} options
   * @param {string} [options.category]
   * @param {string} [options.symbol]
   * @returns {Promise<Array<NormalizedArticle>>}
   */
  async fetchNews(options = {}) {
    throw new Error('Method fetchNews() must be implemented by Provider subclass');
  }
}

/**
 * @typedef {Object} NormalizedArticle
 * @property {string} articleId
 * @property {string} provider
 * @property {string} title
 * @property {string} summary
 * @property {string} source
 * @property {Date} publishedAt
 * @property {string|null} company
 * @property {Array<string>} symbols
 * @property {string} category
 * @property {string} url
 */