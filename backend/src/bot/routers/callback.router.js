export const registerCallbackRouter = (bot) => {
  bot.on('callback_query', async (ctx) => {
    await ctx.answerCbQuery();
    console.log(`[Callback Router] Intercepted callback: ${ctx.callbackQuery?.data}`);
  });
};