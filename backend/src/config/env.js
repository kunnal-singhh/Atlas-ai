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
  maxRecentMessages: parseInt(process.env.MAX_RECENT_MESSAGES || '10', 10),
  maxRetrievedMemories: parseInt(process.env.MAX_RETRIEVED_MEMORIES || '5', 10),
  maxMemorySummaryLength: parseInt(process.env.MAX_MEMORY_SUMMARY_LENGTH || '500', 10),
  minImportanceScoreThreshold: parseInt(process.env.MIN_IMPORTANCE_SCORE || '3', 10),

  finnhubApiKey: process.env.FINNHUB_API_KEY || '',
  financeNewsCategory: process.env.FINANCE_NEWS_CATEGORY || 'general',
  financeCacheTtlMinutes: parseInt(process.env.FINANCE_CACHE_TTL_MINUTES || '30', 10),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

  // Module 10: Live Search (optional — graceful fallback if missing)
  googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY || '',
  googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || '',
  searchCacheTtlMinutes: parseInt(process.env.SEARCH_CACHE_TTL_MINUTES || '15', 10),
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

if (!config.jwtSecret) {
  throw new Error('FATAL: JWT_SECRET is missing in environment variables.');
}