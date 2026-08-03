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
   * Converts standard Markdown formatting to Telegram-compatible HTML tags
   * @param {string} text
   * @returns {string}
   */
  static markdownToHtml(text) {
    if (!text) return '';

    // Escape raw HTML special characters
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks: ```[lang] code ``` -> <pre>code</pre>
    html = html.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, '<pre>$1</pre>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');

    // Inline code: `code` -> <code>code</code>
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Bold: **text** -> <b>text</b>
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Italic: *text* -> <i>text</i>
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

    return html;
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
