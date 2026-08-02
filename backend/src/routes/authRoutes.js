import { Router } from 'express';
import { register, login, telegramWebAppAuth, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/telegram-webapp', telegramWebAppAuth);

// Protected route
router.get('/me', protect, getMe);

export default router;