export class ImportanceRanker {
  /**
   * Keywords indicating high market significance
   */
  static HIGH_IMPACT_KEYWORDS = [
    'fed', 'federal reserve', 'inflation', 'cpi', 'interest rate', 'rate cut',
    'earnings', 'revenue', 'sec', 'antitrust', 'acquisition', 'merger',
    'bankruptcy', 'layoffs', 'guidance', 'gdp', 'recession', 'default'
  ];

  /**
   * Ranks articles by combining market impact, recency, and Module 7 user memories.
   * 
   * @param {Array<Object>} articles 
   * @param {Array<Object>} userMemories User facts retrieved from Module 7 Memory collection
   * @returns {Array<Object>} Articles sorted by importance score descending
   */
  static rank(articles, userMemories = []) {
    // Extract user financial interests and followed companies from memories
    const userTopics = userMemories
      .map((m) => (m.fact + ' ' + (m.keywords || []).join(' ')).toLowerCase())
      .join(' ');

    return articles
      .map((article) => {
        let score = 50; // Base score

        const titleLower = article.title.toLowerCase();
        const summaryLower = (article.summary || '').toLowerCase();

        // 1. High-Impact Market Event Scoring
        for (const keyword of this.HIGH_IMPACT_KEYWORDS) {
          if (titleLower.includes(keyword)) score += 15;
          else if (summaryLower.includes(keyword)) score += 8;
        }

        // 2. Personalization Scoring (Module 7 Memory Alignment)
        if (userTopics) {
          if (article.company && userTopics.includes(article.company.toLowerCase())) {
            score += 35; // Heavy boost for tracked company
          }
          for (const symbol of article.symbols || []) {
            if (userTopics.includes(symbol.toLowerCase())) {
              score += 30; // Boost for tracked symbol
            }
          }
        }

        // 3. Category Weightings
        if (article.category === 'EARNINGS') score += 10;
        if (article.category === 'MACRO') score += 12;

        // 4. Recency Decay (Prefer fresher news)
        const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours <= 2) score += 20;
        else if (ageHours <= 6) score += 10;
        else if (ageHours <= 12) score += 5;
        else score -= Math.min(25, Math.floor(ageHours));

        return { ...article, importanceScore: Math.max(1, score) };
      })
      .sort((a, b) => b.importanceScore - a.importanceScore);
  }
}