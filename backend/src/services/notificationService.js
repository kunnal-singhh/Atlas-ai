import logger from '../utils/logger.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { BriefingService } from './briefingService.js';

class NotificationService {
  constructor() {
    this.bot = null;
  }

  /**
   * Initializes the notification service with the Telegraf bot instance
   * @param {Telegraf} bot 
   */
  initialize(bot) {
    this.bot = bot;
    logger.info('NotificationService initialized with Telegram Bot instance');
  }

  /**
   * Sends a HTML-formatted briefing to a specific user
   * @param {string} telegramId 
   * @param {string} htmlContent 
   * @param {string} briefingType 
   * @returns {Promise<boolean>} Success status
   */
  async sendBriefing(telegramId, htmlContent, briefingType) {
    if (!this.bot) {
      logger.error('NotificationService not initialized. Cannot send Telegram message.');
      return false;
    }

    try {
      logger.info(`Sending ${briefingType} briefing to user ${telegramId}`);
      
      // Use bot.telegram.sendMessage with HTML parse mode
      await this.bot.telegram.sendMessage(telegramId, htmlContent, {
        parse_mode: 'HTML',
      });

      // Update preference tracking timestamp
      const dateNow = new Date();
      const updateField = 
        briefingType === 'morning' ? { lastMorningBriefAt: dateNow } :
        briefingType === 'evening' ? { lastEveningSummaryAt: dateNow } :
        briefingType === 'weekly' ? { lastWeeklyDigestAt: dateNow } : {};

      if (Object.keys(updateField).length > 0) {
        await NotificationPreference.updateOne(
          { telegramId },
          { $set: updateField }
        );
      }

      logger.info(`Successfully sent ${briefingType} briefing to user ${telegramId}`);
      return true;
    } catch (error) {
      // Check if user blocked the bot or chat doesn't exist
      if (error.code === 403 || error.message.includes('forbidden') || error.message.includes('chat not found')) {
        logger.warn(`Failed to send briefing to user ${telegramId} (bot blocked/user not found): ${error.message}`);
        // Optionally mark user as inactive
      } else {
        logger.error(`Error sending briefing to user ${telegramId}: ${error.message}`, { stack: error.stack });
      }
      return false;
    }
  }

  /**
   * Manually triggers a batch send (primarily for REST endpoints / cron loops)
   * @param {string} briefingType - 'morning' | 'evening' | 'weekly'
   */
  async sendToAllSubscribers(briefingType) {
    try {
      logger.info(`Starting broadcast for briefing type: ${briefingType}`);
      const query = { pauseAll: false };
      
      if (briefingType === 'morning') {
        query['morningBrief.enabled'] = true;
      } else if (briefingType === 'evening') {
        query['eveningSummary.enabled'] = true;
      } else if (briefingType === 'weekly') {
        query['weeklyDigest.enabled'] = true;
      } else {
        throw new Error(`Invalid briefing type: ${briefingType}`);
      }

      const subscribers = await NotificationPreference.find(query).lean();
      logger.info(`Found ${subscribers.length} subscribers for ${briefingType} briefing`);

      let successCount = 0;
      for (const sub of subscribers) {
        let content;
        if (briefingType === 'morning') {
          content = await BriefingService.generateMorningBrief(sub.telegramId);
        } else if (briefingType === 'evening') {
          content = await BriefingService.generateEveningSummary(sub.telegramId);
        } else if (briefingType === 'weekly') {
          content = await BriefingService.generateWeeklyDigest(sub.telegramId);
        }

        const success = await this.sendBriefing(sub.telegramId, content, briefingType);
        if (success) successCount++;

        // sequential processing with 100ms pause to respect Telegram rate limit (30 messages per second limit)
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      logger.info(`Broadcast completed. Sent ${successCount}/${subscribers.length} successfully.`);
    } catch (err) {
      logger.error(`Error in sendToAllSubscribers for ${briefingType}: ${err.message}`);
    }
  }
}

export const notificationService = new NotificationService();
