export class TokenManager {
  /**
   * Approximates token count (approx. 4 chars per token for English text)
   * @param {string} text 
   * @returns {number}
   */
  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Prunes history turns to ensure context window remains safely below threshold
   * @param {Array} history - Array of { role, content }
   * @param {number} maxTokens - Token budget for history
   * @returns {Array} Pruned history
   */
  static pruneHistory(history, maxTokens = 4000) {
    let currentTokens = 0;
    const pruned = [];

    // Iterate backwards from most recent message
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const tokens = this.estimateTokens(msg.content);

      if (currentTokens + tokens > maxTokens) {
        break;
      }

      currentTokens += tokens;
      pruned.unshift(msg);
    }

    return pruned;
  }
}
