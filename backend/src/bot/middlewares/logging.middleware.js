export const loggingMiddleware = async (ctx, next) => {
  const startTime = Date.now();
  const updateId = ctx.update.update_id;
  const from = ctx.from ? `@${ctx.from.username || ctx.from.id}` : 'Unknown';
  const updateType = ctx.updateType;

  console.log(`[Telegram Update IN] ID:${updateId} | Type:${updateType} | From:${from}`);

  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[Telegram Update OUT] ID:${updateId} | Processed in ${duration}ms`);
  }
};