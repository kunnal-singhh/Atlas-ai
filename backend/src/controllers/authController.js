import { registerUser, loginWithEmail, authenticateTelegramWebApp } from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { telegramId, firstName, lastName, email, password } = req.body;

    if (!telegramId || !firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required registration fields: telegramId, firstName, email, password',
        error: 'Validation Error'
      });
    }

    const result = await registerUser({ telegramId, firstName, lastName, email, password });
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
        error: 'Validation Error'
      });
    }

    const result = await loginWithEmail(email, password);
    return sendSuccess(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
};

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
