import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { step1Schema, step2Schema, step3Schema, step4Schema } from '../utils/validators';
import { CalculationsController } from '../controllers/calculations.controller';

const router = Router();
const controller = new CalculationsController();

router.post('/', (req, res) => controller.create(req, res));
router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getOne(req, res));
router.put('/:id/step1', validate(step1Schema), (req, res) => controller.step1(req, res));
router.put('/:id/step2', validate(step2Schema), (req, res) => controller.step2(req, res));
router.put('/:id/step3', validate(step3Schema), (req, res) => controller.step3(req, res));
router.put('/:id/step4', validate(step4Schema), (req, res) => controller.step4(req, res));
router.post('/:id/calculate', (req, res) => controller.calculate(req, res));
router.get('/:id/pdf', (req, res) => controller.getPdf(req, res));
router.post('/:id/email', (req, res) => controller.sendEmail(req, res));
router.post('/:id/scenarios', (req, res) => controller.createScenario(req, res));
router.get('/:id/scenarios', (req, res) => controller.getScenarios(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;
