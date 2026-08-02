export const BOT_MESSAGES = {
  WELCOME_BACK: (firstName) =>
    `Welcome back, *${firstName}* 👋\n\nAtlas AI is ready to assist you\\. How can I help you today?`,
  
  NEW_USER_WELCOME: 
    `Welcome to Atlas AI 👋\n\nI'll help you stay informed, organized and productive\\.\n\nLet's get started\\.`,

  HELP: 
    `*Atlas AI \\- Command Center*\n\n` +
    `Here are the basic commands to interact with me:\n` +
    `• /start \\- Initialize or reload your user session\n` +
    `• /help \\- Display available commands and guidance\n\n` +
    `*Tip:* You can send me standard text messages anytime to interact with AI features\\.`,

  UNKNOWN_COMMAND: 
    `I didn't recognize that command\\. Type /help to see what I can do for you\\.`,

  GENERIC_ERROR: 
    `⚠️ An internal error occurred while processing your request\\. Please try again shortly.`,
};