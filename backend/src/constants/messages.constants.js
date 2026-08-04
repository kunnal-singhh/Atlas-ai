export const BOT_MESSAGES = {
  WELCOME_INTRO: 
    `Welcome to Atlas AI 👋\n\nI'll help you stay informed, organized, and productive.\n\nCan I ask you a few quick questions to personalize your experience?`,

  HELP: 
    `<b>Atlas AI - Command Center</b>\n\n` +
    `• /start - Reload session or restart onboarding\n` +
    `• /settings - View and edit your preferences\n` +
    `• /brief - Request an on-demand daily brief (e.g. /brief tech)\n` +
    `• /schedule - Adjust your briefing schedule\n` +
    `• /notifications - Toggle specific briefing types\n` +
    `• /help - Display available commands\n\n` +
    `<b>Tip:</b> Send standard messages anytime to interact with Atlas AI.`,

  UNKNOWN_COMMAND: 
    `I didn't recognize that command. Type /help to see available options.`,

  GENERIC_ERROR: 
    `⚠️ An internal error occurred while processing your request. Please try again shortly.`,

  CHAT_ERROR:
    `⚠️ Atlas encountered an issue communicating with the AI engine. Please try again in a moment.`,

  ONB_CANCELLED: 
    `Onboarding skipped. Default preferences applied. You can customize them anytime using /settings.`,

  ONB_Q_PROFESSION: 
    `<b>Step 1 of 5: Profession</b>\n\nWhat do you do? Select an option below or type your custom profession directly:`,

  ONB_Q_INDUSTRIES: 
    `<b>Step 2 of 5: Industry Focus</b>\n\nWhich industries are you interested in? (Select all that apply, then press <b>Next Step</b>):`,

  ONB_Q_TOPICS: 
    `<b>Step 3 of 5: Core Topics</b>\n\nWhich specific topics do you follow? (e.g., <i>LLMs, Macroeconomics, Quantum Computing</i>)\n\nType your topics separated by commas, or press <b>Skip</b>:`,

  ONB_Q_COMPANIES: 
    `<b>Step 4 of 5: Companies</b>\n\nWhich companies or organizations do you follow? (e.g., <i>NVIDIA, OpenAI, Tesla</i>)\n\nType company names separated by commas, or press <b>Skip</b>:`,

  ONB_Q_BRIEF_TIME: 
    `<b>Step 5 of 5: Daily Briefing Schedule</b>\n\nWhat time would you like to receive your daily briefing?`,

  ONB_Q_CUSTOM_TIME: 
    `Please type your preferred briefing time in 24-hour format (e.g., <b>07:30</b> or <b>20:15</b>):`,

  ONB_Q_NOTIFICATIONS: 
    `<b>Notification Preferences</b>\n\nChoose the types of updates you would like to receive:`,

  ONB_COMPLETED: 
    `🎉 <b>All set! Your profile has been saved.</b>\n\nAtlas AI is now personalized for your preferences. Type /settings anytime to make changes.`,

  ONB_INVALID_TIME: 
    `⚠️ Invalid time format. Please enter time in 24-hour format (e.g., <b>08:00</b> or <b>18:30</b>):`,

  ONB_INVALID_TEXT: 
    `⚠️ Please provide valid text input or use the buttons below.`,

  SETTINGS_HEADER: (user) => {
    const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const prof = escapeHtml(user.preferences?.profession || 'Not set');
    const ind = escapeHtml(user.preferences?.industries?.length ? user.preferences.industries.join(', ') : 'None');
    const top = escapeHtml(user.preferences?.topics?.length ? user.preferences.topics.join(', ') : 'None');
    const comp = escapeHtml(user.preferences?.companies?.length ? user.preferences.companies.join(', ') : 'None');
    const time = escapeHtml(user.preferences?.briefTime || '08:00');

    return `⚙️ <b>Atlas AI Settings &amp; Preferences</b>\n\n` +
      `<b>Profession:</b> ${prof}\n` +
      `<b>Industries:</b> ${ind}\n` +
      `<b>Topics:</b> ${top}\n` +
      `<b>Companies:</b> ${comp}\n` +
      `<b>Briefing Time:</b> ${time}\n\n` +
      `Select an item below to update:`;
  },
};