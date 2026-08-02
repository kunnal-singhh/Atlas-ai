import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { verifyTelegramWebAppData } from '../utils/telegramAuthValidator.js';
import { findOrCreateUser } from './userService.js';

export const registerUser = async ({ telegramId, firstName, lastName, email, password }) => {
  const existingUser = await User.findOne({ $or: [{ telegramId }, { email }] });
  if (existingUser) {
    throw new AppError('User with this Telegram ID or Email already exists', 400);
  }

  const user = await User.create({
    telegramId,
    firstName,
    lastName,
    email,
    password
  });

  await Profile.create({
    userId: user._id,
    telegramId
  });

  const token = generateToken({ id: user._id, telegramId: user.telegramId, role: user.role });
  
  user.password = undefined; // Strip password before returning
  return { user, token };
};

export const loginWithEmail = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ id: user._id, telegramId: user.telegramId, role: user.role });
  user.password = undefined;

  return { user, token };
};

export const authenticateTelegramWebApp = async (initData, telegramUserData) => {
  const isValid = verifyTelegramWebAppData(initData);
  if (!isValid) {
    throw new AppError('Invalid Telegram authentication data integrity check failed', 401);
  }

  const { user } = await findOrCreateUser(telegramUserData);

  const token = generateToken({ id: user._id, telegramId: user.telegramId, role: user.role });
  return { user, token };
};