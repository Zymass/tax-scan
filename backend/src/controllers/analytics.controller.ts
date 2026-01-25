import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private analyticsService = new AnalyticsService();

  async getStats(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : undefined;
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : undefined;

      const stats = await this.analyticsService.getStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: error.message || 'Failed to get analytics' });
    }
  }
}
