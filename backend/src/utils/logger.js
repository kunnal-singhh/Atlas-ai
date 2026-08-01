import winston from 'winston';
import { config } from '../config/env.js';

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'atlas-ai' },
  transports: [
    new winston.transports.Console({
      format: config.nodeEnv === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, stack }) => {
              return `${timestamp} [${level}]: ${stack || message}`;
            })
          )
    })
  ]
});

export default logger;