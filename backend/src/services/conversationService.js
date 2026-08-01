import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

export const getOrCreateActiveConversation = async (userId, telegramId) => {
  let conversation = await Conversation.findOne({ userId, isActive: true });

  if (!conversation) {
    conversation = await Conversation.create({
      userId,
      telegramId,
      title: 'Active Session'
    });
  }

  return conversation;
};

export const logMessage = async ({ conversationId, userId, telegramMessageId, sender, text, metadata = {} }) => {
  const message = await Message.create({
    conversationId,
    userId,
    telegramMessageId,
    sender,
    text,
    metadata
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    $inc: { messageCount: 1 }
  });

  return message;
};