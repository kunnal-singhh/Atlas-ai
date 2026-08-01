import mongoose from 'mongoose';
import { config } from './env.js';
import logger from '../utils/logger.js';

export const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB connected successfully: ${connection.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failure: ${error.message}`);
    process.exit(1);
  }
};