import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    articleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'finnhub',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      default: 'Financial Market News',
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },
    company: {
      type: String,
      default: null,
    },
    symbols: {
      type: [String],
      default: [],
      index: true,
    },
    sector: {
      type: String,
      default: 'General',
    },
    category: {
      type: String,
      enum: ['MARKETS', 'EARNINGS', 'MACRO', 'TECH', 'CRYPTO', 'REGULATION', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    retrievedAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Automatically remove cached articles after 24 hours
    },
  },
  {
    timestamps: true,
  }
);

articleSchema.index({ publishedAt: -1, category: 1 });

export const Article = mongoose.models.Article || mongoose.model('Article', articleSchema);