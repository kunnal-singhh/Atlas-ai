import { Router } from 'express';
import { telegramWebAppAuth, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/telegram-webapp', telegramWebAppAuth);

// Protected route
router.get('/me', protect, getMe);

export default router;