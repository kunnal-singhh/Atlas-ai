import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import logger from '../utils/logger.js';

export const findOrCreateUser = async (telegramUser) => {
  const telegramId = String(telegramUser.id || telegramUser.telegramId);
  const username = telegramUser.username || '';
  const firstName = telegramUser.first_name || telegramUser.firstName || 'User';
  const lastName = telegramUser.last_name || telegramUser.lastName || '';
  const languageCode = telegramUser.language_code || telegramUser.languageCode || 'en';

  let user = await User.findOne({ telegramId });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      telegramId,
      username,
      firstName,
      lastName,
      languageCode
    });

    await Profile.create({
      userId: user._id,
      telegramId
    });

    logger.info(`New user registered via Telegram: ${telegramId}`);
    isNewUser = true;
  } else {
    let isChanged = false;
    if (username && user.username !== username) {
      user.username = username;
      isChanged = true;
    }
    if (firstName && user.firstName !== firstName) {
      user.firstName = firstName;
      isChanged = true;
    }
    if (lastName && user.lastName !== lastName) {
      user.lastName = lastName;
      isChanged = true;
    }
    if (isChanged) {
      await user.save();
    }
  }

  return { user, isNewUser };
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