import { Router } from 'express';
import { FinanceController } from '../controllers/financeController.js';

const router = Router();

// GET /api/finance/briefing?telegramId=123456789&symbol=NVDA
router.get('/briefing', FinanceController.getBriefing);

export default router;