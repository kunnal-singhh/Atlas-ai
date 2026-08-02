import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number, // Telegram IDs fit in JS Number (up to 2^53 - 1)
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
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);