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
      enum: ['PROFILE', 'WORK', 'FINANCE', 'INTEREST', 'PREFERENCE', 'LOCATION', 'GOAL', 'SKILL'],
      default: 'INTEREST',
      index: true,
    },
    structuredData: {
      type: new mongoose.Schema({
        type: { type: String, trim: true },
        entity: { type: String, trim: true },
        ticker: { type: String, trim: true },
        relation: { type: String, trim: true },
        profession: { type: String, trim: true },
        company: { type: String, trim: true },
        location: { type: String, trim: true },
        goal: { type: String, trim: true },
        skill: { type: String, trim: true },
        preference: { type: String, trim: true },
      }, { _id: false }),
      default: {},
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