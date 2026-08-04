import { SchedulerService } from '../services/schedulerService.js';
import { BriefingService } from '../services/briefingService.js';
import { notificationService } from '../services/notificationService.js';
import logger from '../utils/logger.js';

export class ScheduleController {
  /**
   * GET /api/schedule/preferences?telegramId=123
   */
  static async getPreferences(req, res) {
    try {
      const telegramId = req.query.telegramId || req.user?.telegramId;
      if (!telegramId) {
        return res.status(400).json({ error: 'Missing telegramId parameter.' });
      }

      const prefs = await SchedulerService.getPreferences(String(telegramId));
      return res.status(200).json({ success: true, preferences: prefs });
    } catch (error) {
      logger.error('Error in ScheduleController.getPreferences:', { error: error.message });
      return res.status(500).json({ error: 'Internal server error getting preferences.' });
    }
  }

  /**
   * PATCH /api/schedule/preferences
   */
  static async updatePreferences(req, res) {
    try {
      const { telegramId, updates } = req.body;
      if (!telegramId || !updates) {
        return res.status(400).json({ error: 'Missing telegramId or updates payload.' });
      }

      const updated = await SchedulerService.updatePreferences(String(telegramId), updates);
      return res.status(200).json({ success: true, preferences: updated });
    } catch (error) {
      logger.error('Error in ScheduleController.updatePreferences:', { error: error.message });
      return res.status(500).json({ error: 'Internal server error updating preferences.' });
    }
  }

  /**
   * POST /api/schedule/trigger
   */
  static async triggerBriefing(req, res) {
    try {
      const { telegramId, type, focusTopic } = req.body;
      if (!telegramId || !type) {
        return res.status(400).json({ error: 'Missing telegramId or type ("morning" | "evening" | "weekly")' });
      }

      logger.info(`REST: Manually triggering ${type} briefing for ${telegramId}`);
      let content;

      if (type === 'morning') {
        content = await BriefingService.generateMorningBrief(String(telegramId), focusTopic);
      } else if (type === 'evening') {
        content = await BriefingService.generateEveningSummary(String(telegramId));
      } else if (type === 'weekly') {
        content = await BriefingService.generateWeeklyDigest(String(telegramId));
      } else {
        return res.status(400).json({ error: 'Invalid briefing type. Must be: morning, evening, weekly' });
      }

      const success = await notificationService.sendBriefing(String(telegramId), content, type);
      
      return res.status(200).json({
        success,
        type,
        telegramId,
        message: success ? 'Briefing delivered successfully' : 'Briefing failed to deliver',
        htmlContent: content // Return content so developers can inspect it in REST client
      });
    } catch (error) {
      logger.error('Error in ScheduleController.triggerBriefing:', { error: error.message });
      return res.status(500).json({ error: `Internal server error triggering briefing: ${error.message}` });
    }
  }
}
export default ScheduleController;
