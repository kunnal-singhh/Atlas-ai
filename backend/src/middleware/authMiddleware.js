import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'You are not logged in. Please log in to get access.', null, 401);
    }

    const decoded = verifyToken(token);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser || !currentUser.isActive) {
      return sendError(res, 'The user belonging to this token no longer exists or is inactive.', null, 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', error.message, 401);
  }
};