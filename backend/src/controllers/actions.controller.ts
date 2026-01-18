import { Request, Response } from 'express';
import { prisma } from '../db';

export class ActionsController {
  async getActionPlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actions = await prisma.actionPlan.findMany({
        where: { calculation_id: id },
        orderBy: { due_date: 'asc' }
      });
      res.json(actions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAction(req: Request, res: Response) {
    try {
      const { id, actionId } = req.params;
      const { completed } = req.body;

      const action = await prisma.actionPlan.update({
        where: { id: actionId },
        data: {
          completed,
          completed_at: completed ? new Date() : null
        }
      });

      res.json(action);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
