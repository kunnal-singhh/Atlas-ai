import mongoose from 'mongoose';
import { config } from './env.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// Monitor mongoose connection status
mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err.message}`, { error: err });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB. Attempting to reconnect automatically...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('Mongoose successfully reconnected to MongoDB.');
});

export const connectDatabase = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const connection = await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      logger.info(`MongoDB connected successfully: ${connection.connection.host}`);
      return;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        logger.info(`Retrying MongoDB connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('All MongoDB connection attempts exhausted. Exiting.');
  process.exit(1);
};