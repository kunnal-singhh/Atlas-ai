export class FinanceFormatter {
  /**
   * Escape HTML special characters for Telegram safe parsing
   */
  static escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Formats synthesized financial updates into Telegram-friendly HTML
   * 
   * @param {Object} intelligenceData 
   * @param {string} intelligenceData.summaryText
   * @param {Array<Object>} intelligenceData.structuredUpdates
   * @returns {string} Clean HTML output formatted for Telegram
   */
  static formatTelegramReport(intelligenceData) {
    const { summaryText, structuredUpdates } = intelligenceData;

    let html = `<b>📊 Atlas Financial Intelligence</b>\n\n`;
    
    if (summaryText) {
      html += `<i>${this.escapeHtml(summaryText)}</i>\n\n`;
    }

    if (!structuredUpdates || structuredUpdates.length === 0) {
      html += `No critical news updates available at this moment.`;
      return html;
    }

    structuredUpdates.forEach((story, idx) => {
      const symbolsTag = story.symbols && story.symbols.length > 0 
        ? ` (${story.symbols.map((s) => `#${this.escapeHtml(s)}`).join(' ')})` 
        : '';

      html += `<b>${idx + 1}. ${this.escapeHtml(story.headline)}</b>${symbolsTag}\n\n`;
      html += `${this.escapeHtml(story.summary)}\n\n`;
      html += `📈 <b>Why it matters:</b>\n${this.escapeHtml(story.whyItMatters)}\n\n`;
      html += `💡 <b>Key takeaway:</b>\n${this.escapeHtml(story.keyTakeaway)}\n`;

      if (idx < structuredUpdates.length - 1) {
        html += `\n───────────────────\n\n`;
      }
    });

    return html;
  }
}