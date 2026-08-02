export class ResponseHelper {
  static async sendMarkdown(ctx, text, extra = {}) {
    return ctx.reply(text, {
      parse_mode: 'HTML',
      ...extra,
    });
  }

  static async sendHTML(ctx, text, extra = {}) {
    return ctx.reply(text, {
      parse_mode: 'HTML',
      ...extra,
    });
  }

  static async sendError(ctx, text) {
    return ctx.reply(text, {
      parse_mode: 'HTML',
    });
  }
}