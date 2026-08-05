import { toolRegistry } from './toolRegistry.js';
import { User } from '../../models/User.js';
import { Profile } from '../../models/Profile.js';
import { NotificationPreference } from '../../models/NotificationPreference.js';
import logger from '../../utils/logger.js';

/**
 * Profile Tool
 * Retrieves user profile information, settings, preferences, and notification schedules.
 */
const profileTool = {
  name: 'profile',
  description: 'Retrieves the user\'s profile, settings, interests, notification schedules, and industry preferences.',
  category: 'user_data',
  priority: 50,
  keywords: [
    'my profile', 'my settings', 'my preferences', 'my industries',
    'my profession', 'show profile', 'view profile', 'show settings',
    'notification settings', 'briefing schedule', 'my time'
  ],
  patterns: [
    /show (?:my )?(?:profile|settings|preferences|timezone)/i,
    /view (?:my )?(?:profile|settings|preferences)/i,
    /what are my (?:settings|preferences|industries)/i
  ],
  execute: async (telegramId, userMessage, context) => {
    logger.info(`[ProfileTool] Fetching user profile information for telegramId: ${telegramId}`);
    try {
      // 1. Fetch User document
      const user = await User.findOne({ telegramId }).lean();
      if (!user) {
        throw new Error(`User not found for telegramId: ${telegramId}`);
      }

      // 2. Fetch Profile document
      const profile = await Profile.findOne({ telegramId }).lean();

      // 3. Fetch Notification Preferences (from Module 9)
      const notifications = await NotificationPreference.findOne({ telegramId }).lean();

      return {
        type: 'profile',
        result: {
          user,
          profile,
          notifications
        }
      };
    } catch (error) {
      logger.error('[ProfileTool] Failed to retrieve user profile:', error);
      throw error;
    }
  }
};

// Auto-register with the central registry
toolRegistry.register(profileTool);

export default profileTool;
