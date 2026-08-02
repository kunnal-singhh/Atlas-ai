import mongoose from 'mongoose';
import { ONBOARDING_STEPS } from '../constants/onboarding.constants.js';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      default: null,
    },
    firstName: {
      type: String,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      trim: true,
      default: null,
    },
    languageCode: {
      type: String,
      default: 'en',
    },
    onboardingStep: {
      type: String,
      enum: Object.values(ONBOARDING_STEPS),
      default: ONBOARDING_STEPS.IDLE,
      index: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferences: {
      profession: { type: String, default: null, trim: true },
      industries: [{ type: String, trim: true }],
      topics: [{ type: String, trim: true }],
      companies: [{ type: String, trim: true }],
      briefTime: { type: String, default: '08:00', trim: true },
      notifications: {
        morningBrief: { type: Boolean, default: true },
        eveningSummary: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
        breakingNews: { type: Boolean, default: false },
      },
    },
    lastPreferencesUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);