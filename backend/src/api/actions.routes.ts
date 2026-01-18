import { Router } from 'express';
import { ActionsController } from '../controllers/actions.controller';

const router = Router();
const controller = new ActionsController();

router.get('/calculations/:id/actions', (req, res) => controller.getActionPlan(req, res));
router.put('/calculations/:id/actions/:actionId', (req, res) => controller.updateAction(req, res));

export default router;
