/**
 * Escapes special characters for Telegram MarkdownV2 parse mode.
 */
export const escapeMarkdownV2 = (text) => {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

export const bold = (text) => `*${escapeMarkdownV2(text)}*`;
export const italic = (text) => `_${escapeMarkdownV2(text)}_`;

export const codeBlock = (code, language = '') => {
  const safeCode = String(code).replace(/`/g, '\\`');
  return `\`\`\`${language}\n${safeCode}\n\`\`\``;
};