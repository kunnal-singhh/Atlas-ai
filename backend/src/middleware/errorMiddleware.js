import logger from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    statusCode: err.statusCode
  });

  return sendError(
    res,
    err.message,
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    err.statusCode
  );
};