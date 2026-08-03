import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { verifyTelegramWebAppData } from '../utils/telegramAuthValidator.js';
import { findOrCreateUser } from './userService.js';

export const authenticateTelegramWebApp = async (initData, telegramUserData) => {
  const isValid = verifyTelegramWebAppData(initData);
  if (!isValid) {
    throw new AppError('Invalid Telegram authentication data integrity check failed', 401);
  }

  const { user } = await findOrCreateUser(telegramUserData);

  const token = generateToken({ id: user._id, telegramId: user.telegramId });
  return { user, token };
};