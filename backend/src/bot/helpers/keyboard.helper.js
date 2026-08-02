import { Markup } from 'telegraf';

export class KeyboardHelper {
  static buildInlineKeyboard(buttons) {
    const inlineMatrix = buttons.map(row =>
      row.map(btn => Markup.button.callback(btn.text, btn.callbackData))
    );
    return Markup.inlineKeyboard(inlineMatrix);
  }

  static buildReplyKeyboard(buttons, options = { resize: true, oneTime: false }) {
    const keyboard = Markup.keyboard(buttons);
    if (options.resize) keyboard.resize();
    if (options.oneTime) keyboard.oneTime();
    return keyboard;
  }

  static removeKeyboard() {
    return Markup.removeKeyboard();
  }
}