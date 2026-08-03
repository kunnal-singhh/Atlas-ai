import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      index: true,
    },
    fact: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['PREFERENCE', 'INTEREST', 'WORK', 'FINANCE', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    importanceScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    embedding: {
      type: [Number],
      default: [],
      select: false,
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    sourceConversationId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ telegramId: 1, importanceScore: -1 });
memorySchema.index({ telegramId: 1, category: 1 });

export const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);