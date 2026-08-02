import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: false,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    telegramMessageId: {
      type: Number,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'model', 'system', 'bot'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tokensCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ telegramId: 1, createdAt: -1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);