import { financeService } from '../services/financeService.js';
import logger from '../utils/logger.js';

export class FinanceController {
  /**
   * Handles REST request for user financial briefing
   */
  static async getBriefing(req, res) {
    try {
      const telegramId = parseInt(req.query.telegramId, 10) || req.user?.telegramId;
      const symbol = req.query.symbol || null;

      if (!telegramId) {
        return res.status(400).json({ error: 'Missing telegramId parameter.' });
      }

      const result = await financeService.getFinancialBriefing(telegramId, { symbol });
      return res.status(200).json({
        success: true,
        telegramId,
        symbol,
        formattedReport: result.formatted,
      });
    } catch (err) {
      logger.error('Error in FinanceController.getBriefing:', { error: err.message });
      return res.status(500).json({ error: 'Internal Server Error processing finance request.' });
    }
  }
}