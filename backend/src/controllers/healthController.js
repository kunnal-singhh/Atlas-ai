import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse.js';

export const getHealthStatus = (req, res, next) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    const healthData = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatusMap[dbState] || 'Unknown'
    };

    return sendSuccess(res, 'Atlas AI backend service is healthy', healthData, 200);
  } catch (error) {
    next(error);
  }
};