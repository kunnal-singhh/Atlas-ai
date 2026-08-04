import cron from 'node-cron';
import logger from '../utils/logger.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { notificationService } from './notificationService.js';
import { BriefingService } from './briefingService.js';

class CronManager {
  constructor() {
    this.jobs = [];
    this.bot = null;
  }

  /**
   * Initializes the cron scheduler and starts the periodic checks.
   * @param {Telegraf} bot 
   */
  initialize(bot) {
    this.bot = bot;
    notificationService.initialize(bot);
    
    // Schedule the minute-by-minute checker
    const checkJob = cron.schedule('* * * * *', () => this.runPeriodicCheck(), {
      scheduled: true,
      timezone: 'UTC' // Standardizing on UTC for consistency
    });

    this.jobs.push(checkJob);
    logger.info('CronManager initialized: scheduled minute-by-minute briefing dispatcher');
  }

  /**
   * Executed every minute. Checks database for matching scheduled actions.
   */
  async runPeriodicCheck() {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

    try {
      // 1. Dispatch Morning Briefs
      const morningCandidates = await NotificationPreference.find({
        pauseAll: false,
        'morningBrief.enabled': true,
        'morningBrief.cronTime': timeStr,
        $or: [
          { lastMorningBriefAt: null },
          { lastMorningBriefAt: { $lt: todayStart } }
        ]
      });

      if (morningCandidates.length > 0) {
        logger.info(`CronManager: Dispatching ${morningCandidates.length} morning briefs for time: ${timeStr}`);
        for (const sub of morningCandidates) {
          try {
            const htmlContent = await BriefingService.generateMorningBrief(sub.telegramId);
            await notificationService.sendBriefing(sub.telegramId, htmlContent, 'morning');
          } catch (err) {
            logger.error(`Error dispatching morning brief to ${sub.telegramId}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 100)); // Rate limit protection
        }
      }

      // 2. Dispatch Evening Summaries
      const eveningCandidates = await NotificationPreference.find({
        pauseAll: false,
        'eveningSummary.enabled': true,
        'eveningSummary.cronTime': timeStr,
        $or: [
          { lastEveningSummaryAt: null },
          { lastEveningSummaryAt: { $lt: todayStart } }
        ]
      });

      if (eveningCandidates.length > 0) {
        logger.info(`CronManager: Dispatching ${eveningCandidates.length} evening summaries for time: ${timeStr}`);
        for (const sub of eveningCandidates) {
          try {
            const htmlContent = await BriefingService.generateEveningSummary(sub.telegramId);
            await notificationService.sendBriefing(sub.telegramId, htmlContent, 'evening');
          } catch (err) {
            logger.error(`Error dispatching evening summary to ${sub.telegramId}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 100)); // Rate limit protection
        }
      }

      // 3. Dispatch Weekly Digests
      const weeklyCandidates = await NotificationPreference.find({
        pauseAll: false,
        'weeklyDigest.enabled': true,
        'weeklyDigest.dayOfWeek': dayOfWeek,
        'weeklyDigest.cronTime': timeStr,
        $or: [
          { lastWeeklyDigestAt: null },
          { lastWeeklyDigestAt: { $lt: sixDaysAgo } }
        ]
      });

      if (weeklyCandidates.length > 0) {
        logger.info(`CronManager: Dispatching ${weeklyCandidates.length} weekly digests for day: ${dayOfWeek}, time: ${timeStr}`);
        for (const sub of weeklyCandidates) {
          try {
            const htmlContent = await BriefingService.generateWeeklyDigest(sub.telegramId);
            await notificationService.sendBriefing(sub.telegramId, htmlContent, 'weekly');
          } catch (err) {
            logger.error(`Error dispatching weekly digest to ${sub.telegramId}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 100)); // Rate limit protection
        }
      }

    } catch (error) {
      logger.error(`Error in runPeriodicCheck loop: ${error.message}`, { stack: error.stack });
    }
  }

  /**
   * Stops all running cron jobs
   */
  stopAll() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    logger.info('All cron jobs stopped');
  }
}

export const cronManager = new CronManager();
export default cronManager;
