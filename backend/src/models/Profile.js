import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    telegramId: {
      type: String,
      required: true,
      index: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dailyBriefingTime: {
      type: String,
      default: '08:00'
    },
    interests: {
      type: [String],
      default: []
    },
    currency: {
      type: String,
      default: 'USD'
    },
    aiPreferences: {
      tone: {
        type: String,
        enum: ['concise', 'detailed', 'friendly'],
        default: 'concise'
      },
      explainWhyNewsMatters: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

export const Profile = mongoose.model('Profile', profileSchema);