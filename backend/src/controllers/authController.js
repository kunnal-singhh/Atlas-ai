import { authenticateTelegramWebApp } from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const telegramWebAppAuth = async (req, res, next) => {
  try {
    const { initData, user } = req.body;

    if (!initData || !user) {
      return res.status(400).json({
        success: false,
        message: 'Missing Telegram WebApp initData or user payload',
        error: 'Validation Error'
      });
    }

    const result = await authenticateTelegramWebApp(initData, user);
    return sendSuccess(res, 'Telegram WebApp authentication successful', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Current user profile fetched successfully', { user: req.user }, 200);
  } catch (error) {
    next(error);
  }
};
