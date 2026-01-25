import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();

// GET /api/analytics/stats - Получить статистику
// Query params: startDate, endDate (опционально, формат ISO)
router.get('/stats', (req, res) => analyticsController.getStats(req, res));

export default router;
