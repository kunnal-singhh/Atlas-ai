import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      default: ''
    },
    username: {
      type: String,
      default: ''
    },
    isBot: {
      type: Boolean,
      default: false
    },
    languageCode: {
      type: String,
      default: 'en'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model('User', userSchema);