import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  webhookUrl: process.env.WEBHOOK_URL,
  mongodbUri: process.env.MONGODB_URI,
  geminiApiKey: process.env.GEMINI_API_KEY,
};

if (!config.telegramBotToken) {
  throw new Error('FATAL: TELEGRAM_BOT_TOKEN is missing in environment variables.');
}

if (!config.mongodbUri) {
  throw new Error('FATAL: MONGODB_URI is missing in environment variables.');
}

if (!config.geminiApiKey) {
  throw new Error('FATAL: GEMINI_API_KEY is missing in environment variables.');
}