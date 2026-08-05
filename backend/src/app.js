import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';
import { config } from './config/env.js';

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body Parsers - Skip express.json() for Telegram webhook updates
app.use((req, res, next) => {
  const isWebhook = req.originalUrl.startsWith('/bot') || 
                    (process.env.WEBHOOK_PATH && req.originalUrl === process.env.WEBHOOK_PATH);
  
  if (isWebhook) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/schedule', scheduleRoutes);

// Temporary debug route to inspect live Render DB state
import { Message } from './models/Message.js';
import { User } from './models/User.js';
app.get('/api/debug-messages', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const messagesCount = await Message.countDocuments();
    const messages = await Message.find().sort({ createdAt: -1 }).limit(10).lean();

    // Helper to mask token
    const maskString = (str) => {
      if (!str) return 'undefined';
      if (str.length < 8) return 'too short';
      return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
    };

    const envDebug = {
      NODE_ENV: process.env.NODE_ENV,
      configNodeEnv: config.nodeEnv,
      PORT: process.env.PORT,
      WEBHOOK_URL: config.webhookUrl,
      TELEGRAM_BOT_TOKEN_MASKED: maskString(config.telegramBotToken),
      MONGODB_URI_MASKED: maskString(config.mongodbUri),
      GEMINI_API_KEY_MASKED: maskString(config.geminiApiKey)
    };

    res.json({ users, messagesCount, envDebug, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NOTE: No catch-all 404 here intentionally.
// The Telegraf webhook middleware is registered dynamically in server.js
// via atlasBot.start(app) AFTER this file is loaded. A catch-all here
// would intercept all Telegram updates and return 404 before the bot sees them.

// Central Error Handler
app.use(errorMiddleware);

export default app;