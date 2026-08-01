import { getUserProfile, updateUserProfile } from '../../services/userService.js';
import { getOrCreateActiveConversation, logMessage } from '../../services/conversationService.js';
import logger from '../../utils/logger.js';

export const handleStartCommand = async (ctx) => {
  const user = ctx.state.user;
  const welcomeText = 
    `👋 Welcome to *Atlas AI*, ${user.firstName}!\n\n` +
    `I am your intelligent assistant. Here is what I can do for you:\n` +
    `• 🧠 *Memory & Conversations*: Chat with me naturally.\n` +
    `• 📊 *Finance Intelligence*: Track expenses and finance metrics.\n` +
    `• 📰 *Briefings*: Get customized news and daily updates.\n\n` +
    `Type /help to view available commands.`;

  const activeConv = await getOrCreateActiveConversation(user._id, user.telegramId);
  await logMessage({
    conversationId: activeConv._id,
    userId: user._id,
    telegramMessageId: ctx.message.message_id,
    sender: 'user',
    text: '/start'
  });

  const replyMsg = await ctx.replyWithMarkdownV2(welcomeText.replace(/([._\-!])/g, '\\$1'));
  
  await logMessage({
    conversationId: activeConv._id,
    userId: user._id,
    telegramMessageId: replyMsg.message_id,
    sender: 'bot',
    text: welcomeText
  });
};

export const handleHelpCommand = async (ctx) => {
  const helpText = 
    `📌 *Atlas AI Commands*\n\n` +
    `/start - Initialize assistant\n` +
    `/profile - View your settings and preferences\n` +
    `/help - View command instructions\n\n` +
    `Send any text message to start chatting!`;

  await ctx.replyWithMarkdownV2(helpText.replace(/([._\-!])/g, '\\$1'));
};

export const handleProfileCommand = async (ctx) => {
  const user = ctx.state.user;
  const profile = await getUserProfile(user._id);

  const profileText = 
    `👤 *User Profile*\n\n` +
    `• *Name*: ${user.firstName} ${user.lastName}\n` +
    `• *Username*: @${user.username || 'N/A'}\n` +
    `• *Timezone*: ${profile.timezone}\n` +
    `• *Currency*: ${profile.currency}\n` +
    `• *Daily Briefing Time*: ${profile.dailyBriefingTime}\n` +
    `• *AI Tone*: ${profile.aiPreferences.tone}`;

  await ctx.replyWithMarkdownV2(profileText.replace(/([._\-!])/g, '\\$1'));
};

export const handleIncomingTextMessage = async (ctx) => {
  const user = ctx.state.user;
  const userMsgText = ctx.message.text;

  const activeConv = await getOrCreateActiveConversation(user._id, user.telegramId);

  await logMessage({
    conversationId: activeConv._id,
    userId: user._id,
    telegramMessageId: ctx.message.message_id,
    sender: 'user',
    text: userMsgText
  });

  const acknowledgment = `🤖 Received your message: "${userMsgText}". AI engine integration scheduled for upcoming modules!`;
  
  const botReply = await ctx.reply(acknowledgment);

  await logMessage({
    conversationId: activeConv._id,
    userId: user._id,
    telegramMessageId: botReply.message_id,
    sender: 'bot',
    text: acknowledgment
  });
};