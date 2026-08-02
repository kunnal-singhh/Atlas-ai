import crypto from 'crypto';
import { config } from '../config/env.js';

export const verifyTelegramWebAppData = (initData) => {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) return false;

    urlParams.delete('hash');

    const paramsArray = Array.from(urlParams.entries());
    paramsArray.sort(([a], [b]) => a.localeCompare(b));

    const dataCheckString = paramsArray
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.telegramBotToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    return false;
  }
};