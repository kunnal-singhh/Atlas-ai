import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController.js';

const router = Router();

// GET /api/schedule/preferences?telegramId=123
router.get('/preferences', ScheduleController.getPreferences);

// PATCH /api/schedule/preferences
router.patch('/preferences', ScheduleController.updatePreferences);

// POST /api/schedule/trigger
router.post('/trigger', ScheduleController.triggerBriefing);

export default router;
