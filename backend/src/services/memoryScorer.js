export class MemoryScorer {
  /**
   * Scores a memory entry based on query keyword matching and static importance
   * @param {Object} memory - Memory document
   * @param {Array<string>} queryKeywords - Extracted search keywords
   * @returns {number} Score
   */
  static scoreMemory(memory, queryKeywords = []) {
    let score = memory.importanceScore || 5;

    if (!queryKeywords.length) {
      return score;
    }

    const memoryText = `${memory.fact} ${memory.keywords ? memory.keywords.join(' ') : ''}`.toLowerCase();

    let matches = 0;
    for (const kw of queryKeywords) {
      if (kw.length > 2 && memoryText.includes(kw.toLowerCase())) {
        matches++;
      }
    }

    // Keyword match boost
    score += matches * 3;

    return score;
  }

  /**
   * Ranks list of memories descending by computed score
   */
  static rankMemories(memories, queryKeywords = []) {
    return memories
      .map((mem) => ({
        memory: mem,
        score: this.scoreMemory(mem, queryKeywords),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.memory);
  }
}