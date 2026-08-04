import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    morningBrief: {
      enabled: { type: Boolean, default: true },
      cronTime: { type: String, default: '08:00' },
      timezone: { type: String, default: 'UTC' },
    },
    eveningSummary: {
      enabled: { type: Boolean, default: true },
      cronTime: { type: String, default: '18:00' },
      timezone: { type: String, default: 'UTC' },
    },
    weeklyDigest: {
      enabled: { type: Boolean, default: true },
      dayOfWeek: { type: Number, default: 1, min: 0, max: 6 }, // 0=Sun, 1=Mon
      cronTime: { type: String, default: '09:00' },
      timezone: { type: String, default: 'UTC' },
    },
    pauseAll: {
      type: Boolean,
      default: false,
    },
    lastMorningBriefAt: { type: Date, default: null },
    lastEveningSummaryAt: { type: Date, default: null },
    lastWeeklyDigestAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model('NotificationPreference', notificationPreferenceSchema);
