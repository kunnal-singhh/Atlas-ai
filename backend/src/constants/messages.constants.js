export const BOT_MESSAGES = {
  WELCOME_INTRO: 
    `Welcome to Atlas AI 👋\n\nI'll help you stay informed, organized, and productive\\.\n\nCan I ask you a few quick questions to personalize your experience?`,

  HELP: 
    `*Atlas AI \\- Command Center*\n\n` +
    `• /start \\- Reload session or restart onboarding\n` +
    `• /settings \\- View and edit your preferences\n` +
    `• /help \\- Display available commands\n\n` +
    `*Tip:* Send standard messages anytime to interact with AI features\\.`,

  UNKNOWN_COMMAND: 
    `I didn't recognize that command\\. Type /help to see what I can do for you\\.`,

  GENERIC_ERROR: 
    `⚠️ An internal error occurred while processing your request\\. Please try again shortly\\.`,

  // --- ONBOARDING MESSAGES ---
  ONB_CANCELLED: 
    `Onboarding skipped\\. Default preferences applied\\. You can customize them anytime using /settings\\.`,

  ONB_Q_PROFESSION: 
    `*Step 1 of 5: Profession*\n\nWhat do you do? Select an option below or type your custom profession directly:`,

  ONB_Q_INDUSTRIES: 
    `*Step 2 of 5: Industry Focus*\n\nWhich industries are you interested in? (Select all that apply, then press *Next Step*):`,

  ONB_Q_TOPICS: 
    `*Step 3 of 5: Core Topics*\n\nWhich specific topics do you follow? (e.g., *LLMs, Macroeconomics, Quantum Computing*)\n\nType your topics separated by commas, or press *Skip*:`,

  ONB_Q_COMPANIES: 
    `*Step 4 of 5: Companies*\n\nWhich companies or organizations do you follow? (e.g., *NVIDIA, OpenAI, Tesla*)\n\nType company names separated by commas, or press *Skip*:`,

  ONB_Q_BRIEF_TIME: 
    `*Step 5 of 5: Daily Briefing Schedule*\n\nWhat time would you like to receive your daily briefing?`,

  ONB_Q_CUSTOM_TIME: 
    `Please type your preferred briefing time in 24-hour format (e.g., *07:30* or *20:15*):`,

  ONB_Q_NOTIFICATIONS: 
    `*Notification Preferences*\n\nChoose the types of updates you would like to receive:`,

  ONB_COMPLETED: 
    `🎉 *All set! Your profile has been saved.*\n\nAtlas AI is now personalized for your preferences\\. Type /settings anytime to make changes\\.`,

  ONB_INVALID_TIME: 
    `⚠️ Invalid time format\\. Please enter time in 24-hour format (e.g., *08:00* or *18:30*):`,

  ONB_INVALID_TEXT: 
    `⚠️ Please provide valid text input or use the buttons below\\.`,

  // --- SETTINGS MESSAGES ---
  SETTINGS_HEADER: (user) => {
    const prof = user.preferences?.profession || 'Not set';
    const ind = user.preferences?.industries?.length ? user.preferences.industries.join(', ') : 'None';
    const top = user.preferences?.topics?.length ? user.preferences.topics.join(', ') : 'None';
    const comp = user.preferences?.companies?.length ? user.preferences.companies.join(', ') : 'None';
    const time = user.preferences?.briefTime || '08:00';

    return `⚙️ *Atlas AI Settings & Preferences*\n\n` +
      `*Profession:* ${prof}\n` +
      `*Industries:* ${ind}\n` +
      `*Topics:* ${top}\n` +
      `*Companies:* ${comp}\n` +
      `*Briefing Time:* ${time}\n\n` +
      `Select an item below to update:`;
  }
};