export const getBotConfig = () => {
  // Uses your project's TELEGRAM_BOT_TOKEN
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('FATAL: TELEGRAM_BOT_TOKEN is missing in environment variables.');
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookPath = process.env.WEBHOOK_PATH || `/bot${token}`;
  const port = parseInt(process.env.PORT || '3000', 10);

  if (nodeEnv === 'production' && !webhookUrl) {
    throw new Error('FATAL: WEBHOOK_URL must be defined in production environment.');
  }

  return {
    token,
    nodeEnv,
    webhookUrl,
    webhookPath,
    port,
  };
};