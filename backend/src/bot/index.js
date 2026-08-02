import { Telegraf } from 'telegraf';
import { getBotConfig } from '../config/bot.config.js';

import { loggingMiddleware } from './middlewares/logging.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { userMiddleware } from './middlewares/user.middleware.js';

import { BotController } from './controllers/bot.controller.js';
import { registerCommandRouter } from './routers/command.router.js';
import { registerMessageRouter } from './routers/message.router.js';
import { registerCallbackRouter } from './routers/callback.router.js';

export class AtlasBot {
  constructor() {
    this.config = getBotConfig();
    this.bot = new Telegraf(this.config.token);
    this.controller = new BotController();

    this.initializeMiddlewares();
    this.initializeRouters();
  }

  initializeMiddlewares() {
    this.bot.use(errorMiddleware);
    this.bot.use(loggingMiddleware);
    this.bot.use(userMiddleware);
  }

  initializeRouters() {
    registerCommandRouter(this.bot, this.controller);
    registerMessageRouter(this.bot, this.controller);
    registerCallbackRouter(this.bot);
  }

  async start(expressApp) {
    if (this.config.nodeEnv === 'production') {
      if (!expressApp) {
        throw new Error('[Bot Init] Express instance is required for production webhook setup.');
      }

      const fullWebhookUrl = `${this.config.webhookUrl}${this.config.webhookPath}`;
      expressApp.use(this.bot.webhookCallback(this.config.webhookPath));
      await this.bot.telegram.setWebhook(fullWebhookUrl);
      
      console.log(`[Bot Init] Webhook successfully established at: ${fullWebhookUrl}`);
    } else {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
      this.bot.launch();
      console.log('[Bot Init] Long Polling started successfully (Development Mode)...');
    }

    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const shutdown = (reason) => {
      console.log(`[Bot Shutdown] Signal received: ${reason}. Stopping Telegraf instance...`);
      this.bot.stop(reason);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }

  getTelegrafInstance() {
    return this.bot;
  }
}