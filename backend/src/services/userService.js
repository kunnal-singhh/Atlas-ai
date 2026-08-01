import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import logger from '../utils/logger.js';

export const findOrCreateUser = async (telegramUser) => {
  const telegramId = telegramUser.id.toString();

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({
      telegramId,
      firstName: telegramUser.first_name || 'User',
      lastName: telegramUser.last_name || '',
      username: telegramUser.username || '',
      isBot: telegramUser.is_bot || false,
      languageCode: telegramUser.language_code || 'en'
    });

    await Profile.create({
      userId: user._id,
      telegramId
    });

    logger.info(`New user registered via Telegram: ${telegramId}`);
  } else {
    user.lastInteractionAt = new Date();
    await user.save();
  }

  return user;
};

export const getUserProfile = async (userId) => {
  const profile = await Profile.findOne({ userId }).populate('userId');
  return profile;
};

export const updateUserProfile = async (userId, updateData) => {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  return profile;
};