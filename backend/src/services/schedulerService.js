import { NotificationPreference } from '../models/NotificationPreference.js';
import { User } from '../models/User.js';
import logger from '../utils/logger.js';

export class SchedulerService {
  /**
   * Gets or initializes the notification preferences for a user
   * @param {string} telegramId 
   * @returns {Promise<Object>} Preferences object
   */
  static async getPreferences(telegramId) {
    try {
      let prefs = await NotificationPreference.findOne({ telegramId });
      
      if (!prefs) {
        // Query User to sync default preferences from onboarding if they exist
        const user = await User.findOne({ telegramId }).lean();
        const userPrefs = user?.preferences || {};
        const briefTime = userPrefs.briefTime || '08:00';
        
        const notifications = userPrefs.notifications || {};
        
        prefs = await NotificationPreference.create({
          telegramId,
          morningBrief: {
            enabled: notifications.morningBrief !== undefined ? notifications.morningBrief : true,
            cronTime: briefTime,
          },
          eveningSummary: {
            enabled: notifications.eveningSummary !== undefined ? notifications.eveningSummary : true,
            cronTime: '18:00',
          },
          weeklyDigest: {
            enabled: notifications.weeklyDigest !== undefined ? notifications.weeklyDigest : true,
            dayOfWeek: 1, // Monday
            cronTime: '09:00',
          },
          pauseAll: false,
        });
        
        logger.info(`Initialized default NotificationPreference for user ${telegramId}`);
      }
      
      return prefs;
    } catch (error) {
      logger.error(`Error in SchedulerService.getPreferences for ${telegramId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates partial fields in notification preferences
   * @param {string} telegramId 
   * @param {Object} updates 
   * @returns {Promise<Object>} Updated preferences
   */
  static async updatePreferences(telegramId, updates) {
    try {
      const updated = await NotificationPreference.findOneAndUpdate(
        { telegramId },
        { $set: updates },
        { new: true, runValidators: true }
      );
      
      // If we don't have a record yet, getPreferences will initialize it, and then we apply updates
      if (!updated) {
        await SchedulerService.getPreferences(telegramId);
        return await NotificationPreference.findOneAndUpdate(
          { telegramId },
          { $set: updates },
          { new: true, runValidators: true }
        );
      }
      
      logger.info(`Updated notification preferences for user ${telegramId}`);
      return updated;
    } catch (error) {
      logger.error(`Error in SchedulerService.updatePreferences for ${telegramId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggles a specific briefing type enabled state
   * @param {string} telegramId 
   * @param {string} type - 'morningBrief' | 'eveningSummary' | 'weeklyDigest'
   * @returns {Promise<Object>} Updated preferences
   */
  static async toggleBriefing(telegramId, type) {
    try {
      const prefs = await SchedulerService.getPreferences(telegramId);
      const fieldPath = `${type}.enabled`;
      const currentVal = prefs[type]?.enabled;
      
      return await SchedulerService.updatePreferences(telegramId, {
        [fieldPath]: !currentVal
      });
    } catch (error) {
      logger.error(`Error in SchedulerService.toggleBriefing for ${telegramId} (${type}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Sets the cron time for a briefing type
   * @param {string} telegramId 
   * @param {string} type - 'morningBrief' | 'eveningSummary' | 'weeklyDigest'
   * @param {string} time - 'HH:MM' (24-hour format)
   * @returns {Promise<Object>} Updated preferences
   */
  static async setScheduleTime(telegramId, type, time) {
    // Validate HH:MM format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new Error('Invalid time format. Must be HH:MM.');
    }

    try {
      const fieldPath = `${type}.cronTime`;
      const updates = { [fieldPath]: time };
      
      // If setting morning brief time, also sync with main User preferences
      if (type === 'morningBrief') {
        await User.updateOne(
          { telegramId },
          { $set: { 'preferences.briefTime': time } }
        );
      }
      
      return await SchedulerService.updatePreferences(telegramId, updates);
    } catch (error) {
      logger.error(`Error in SchedulerService.setScheduleTime for ${telegramId} (${type} to ${time}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggles the master pauseAll switch
   * @param {string} telegramId 
   * @returns {Promise<Object>} Updated preferences
   */
  static async togglePauseAll(telegramId) {
    try {
      const prefs = await SchedulerService.getPreferences(telegramId);
      return await SchedulerService.updatePreferences(telegramId, {
        pauseAll: !prefs.pauseAll
      });
    } catch (error) {
      logger.error(`Error in SchedulerService.togglePauseAll for ${telegramId}: ${error.message}`);
      throw error;
    }
  }
}
