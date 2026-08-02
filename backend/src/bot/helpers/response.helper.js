export class ResponseHelper {
  static async sendMarkdown(ctx, text, extra = {}) {
    return ctx.reply(text, {
      parse_mode: 'MarkdownV2',
      ...extra,
    });
  }

  static async sendError(ctx, text) {
    return ctx.reply(text, {
      parse_mode: 'MarkdownV2',
    });
  }
}