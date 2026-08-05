import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    telegramId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'General Conversation'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    messageCount: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);