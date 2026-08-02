export class FormatterService {
  /**
   * Cleans text for display on Telegram
   * @param {string} text 
   * @returns {string}
   */
  static formatForTelegram(text) {
    if (!text) return '';
    // Normalize excessive newlines
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Splits long AI responses into <= 4000 character chunks to respect Telegram boundaries
   * @param {string} text 
   * @param {number} limit 
   * @returns {Array<string>}
   */
  static chunkMessage(text, limit = 4000) {
    if (!text) return [];
    if (text.length <= limit) return [text];

    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      if ((currentChunk + '\n' + paragraph).length > limit) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        // Handle paragraphs that individually exceed limit
        if (paragraph.length > limit) {
          let remaining = paragraph;
          while (remaining.length > limit) {
            chunks.push(remaining.substring(0, limit));
            remaining = remaining.substring(limit);
          }
          currentChunk = remaining;
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n${paragraph}` : paragraph;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
