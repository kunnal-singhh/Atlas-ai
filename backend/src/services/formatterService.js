export class FormatterService {
  /**
   * Cleans and formats text for Telegram — converts Markdown to HTML
   * @param {string} text 
   * @returns {string}
   */
  static formatForTelegram(text) {
    if (!text) return '';
    // Convert Markdown → Telegram HTML, then normalize excessive newlines
    return FormatterService.markdownToHtml(text).replace(/\n{3,}/g, '\n\n').trim();
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

    // Headings: ### Heading -> <b>Heading</b>
    html = html.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

    // Bold: **text** -> <b>text</b>
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Italic: *text* or _text_ -> <i>text</i>
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/_(.*?)_/g, '<i>$1</i>');

    // Hyperlinks: [text](url) -> <a href="url">text</a>
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2">$1</a>');

    // Bullet lists: - item or * item -> • item
    html = html.replace(/^[\-\*]\s+(.+)$/gm, '• $1');

    // Numbered lists: 1. item stays as-is (already renders fine in Telegram)
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '$1. $2');

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
