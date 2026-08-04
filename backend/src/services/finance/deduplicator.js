import crypto from 'crypto';

export class Deduplicator {
  /**
   * Generates a deterministic hash fingerprint for a title
   */
  static generateFingerprint(title) {
    const cleaned = (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .sort()
      .join(' ');

    return crypto.createHash('md5').update(cleaned || title).digest('hex');
  }

  /**
   * Calculates Jaccard token similarity between two text titles (0.0 to 1.0)
   */
  static calculateSimilarity(titleA, titleB) {
    const tokenize = (text) =>
      new Set(
        text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/gi, '')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

    const setA = tokenize(titleA);
    const setB = tokenize(titleB);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const token of setA) {
      if (setB.has(token)) intersection++;
    }

    const union = new Set([...setA, ...setB]).size;
    return intersection / union;
  }

  /**
   * Filters out exact and highly similar duplicate articles
   * @param {Array<Object>} articles 
   * @param {number} threshold Similarity threshold (default: 0.55)
   * @returns {Array<Object>} Deduplicated articles
   */
  static deduplicate(articles, threshold = 0.55) {
    const uniqueArticles = [];
    const seenFingerprints = new Set();

    for (const article of articles) {
      const fingerprint = article.fingerprint || this.generateFingerprint(article.title);
      article.fingerprint = fingerprint;

      // Exact fingerprint duplicate check
      if (seenFingerprints.has(fingerprint)) {
        continue;
      }

      // Semantic title similarity check against already accepted articles
      const isDuplicate = uniqueArticles.some((existing) => {
        const similarity = this.calculateSimilarity(existing.title, article.title);
        return similarity >= threshold;
      });

      if (!isDuplicate) {
        seenFingerprints.add(fingerprint);
        uniqueArticles.push(article);
      }
    }

    return uniqueArticles;
  }
}