/**
 * Escapes HTML special characters for Telegram HTML parse mode.
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export const bold = (text) => `<b>${escapeHtml(text)}</b>`;
export const italic = (text) => `<i>${escapeHtml(text)}</i>`;

export const codeBlock = (code, language = '') => {
  const safeCode = escapeHtml(code);
  return `<pre>${safeCode}</pre>`;
};

/**
 * Legacy escape MarkdownV2 function maintained for backward compatibility
 */
export const escapeMarkdownV2 = (text) => {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};