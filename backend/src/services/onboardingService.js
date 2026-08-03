import { User } from '../models/User.js';
import { ONBOARDING_STEPS } from '../constants/onboarding.constants.js';

export class OnboardingService {
  /**
   * Set user onboarding step state safely
   */
  async setStep(telegramId, step) {
    const isCompleted = step === ONBOARDING_STEPS.COMPLETED;
    return User.findOneAndUpdate(
      { telegramId },
      { 
        $set: { 
          onboardingStep: step,
          ...(isCompleted ? { onboardingCompleted: true } : {})
        } 
      },
      { new: true }
    );
  }

  /**
   * Save profession selection
   */
  async saveProfession(telegramId, profession) {
    const cleanProfession = profession.trim().substring(0, 100);
    return User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          'preferences.profession': cleanProfession,
          onboardingStep: ONBOARDING_STEPS.ASK_INDUSTRIES,
          lastPreferencesUpdated: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Toggle industry selection for multi-select keyboard
   */
  async toggleIndustry(telegramId, industry) {
    const user = await User.findOne({ telegramId });
    if (!user) throw new Error('User not found');

    const currentIndustries = user.preferences.industries || [];
    const exists = currentIndustries.includes(industry);

    const updatedIndustries = exists
      ? currentIndustries.filter((i) => i !== industry)
      : [...currentIndustries, industry];

    user.preferences.industries = updatedIndustries;
    user.lastPreferencesUpdated = new Date();
    await user.save();

    return user;
  }

  /**
   * Process free-text comma-separated list (Topics or Companies)
   */
  async saveListInput(telegramId, field, rawInput) {
    if (!['topics', 'companies'].includes(field)) {
      throw new Error(`Invalid list field: ${field}`);
    }

    const items = rawInput
      ? rawInput
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .slice(0, 20) // Enforce limit
      : [];

    const user = await User.findOne({ telegramId });
    if (!user) throw new Error('User not found');

    // Deduplicate case-insensitively
    const existing = user.preferences[field] || [];
    const combined = Array.from(new Set([...existing, ...items]));

    user.preferences[field] = combined;
    user.lastPreferencesUpdated = new Date();

    if (field === 'topics') {
      user.onboardingStep = ONBOARDING_STEPS.ASK_COMPANIES;
    } else if (field === 'companies') {
      user.onboardingStep = ONBOARDING_STEPS.ASK_BRIEF_TIME;
    }

    await user.save();
    return user;
  }

  /**
   * Validate and save brief time (HH:MM 24-hr format)
   */
  async saveBriefTime(telegramId, timeString) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeString)) {
      return { success: false, reason: 'INVALID_FORMAT' };
    }

    const user = await User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          'preferences.briefTime': timeString,
          onboardingStep: ONBOARDING_STEPS.ASK_NOTIFICATIONS,
          lastPreferencesUpdated: new Date(),
        },
      },
      { new: true }
    );

    return { success: true, user };
  }

  /**
   * Toggle boolean notification setting
   */
  async toggleNotification(telegramId, key) {
    const user = await User.findOne({ telegramId });
    if (!user) throw new Error('User not found');

    const currentValue = user.preferences.notifications?.[key] ?? false;
    user.preferences.notifications[key] = !currentValue;
    user.lastPreferencesUpdated = new Date();

    await user.save();
    return user;
  }

  /**
   * Finish onboarding session
   */
  async completeOnboarding(telegramId) {
    return User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          onboardingStep: ONBOARDING_STEPS.COMPLETED,
          onboardingCompleted: true,
          lastPreferencesUpdated: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Skip onboarding completely
   */
  async skipOnboarding(telegramId) {
    return User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          onboardingStep: ONBOARDING_STEPS.SKIPPED,
          onboardingCompleted: false,
          lastPreferencesUpdated: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Set user settings step state safely
   */
  async setSettingsStep(telegramId, step) {
    return User.findOneAndUpdate(
      { telegramId },
      { $set: { settingsStep: step } },
      { new: true }
    );
  }

  /**
   * Update profession directly from settings without changing onboardingStep
   */
  async updateProfession(telegramId, profession) {
    const cleanProfession = profession.trim().substring(0, 100);
    return User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          'preferences.profession': cleanProfession,
          settingsStep: null,
          lastPreferencesUpdated: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Update list inputs (topics, companies) directly from settings without changing onboardingStep
   */
  async updateListInput(telegramId, field, rawInput) {
    if (!['topics', 'companies'].includes(field)) {
      throw new Error(`Invalid list field: ${field}`);
    }

    const items = rawInput
      ? rawInput
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .slice(0, 20)
      : [];

    const user = await User.findOne({ telegramId });
    if (!user) throw new Error('User not found');

    const existing = user.preferences[field] || [];
    const combined = Array.from(new Set([...existing, ...items]));

    user.preferences[field] = combined;
    user.settingsStep = null;
    user.lastPreferencesUpdated = new Date();

    await user.save();
    return user;
  }

  /**
   * Update briefing time directly from settings without changing onboardingStep
   */
  async updateBriefTime(telegramId, timeString) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeString)) {
      return { success: false, reason: 'INVALID_FORMAT' };
    }

    const user = await User.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          'preferences.briefTime': timeString,
          settingsStep: null,
          lastPreferencesUpdated: new Date(),
        },
      },
      { new: true }
    );

    return { success: true, user };
  }
}
