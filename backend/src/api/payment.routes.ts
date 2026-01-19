import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Protected routes
router.post('/create', authMiddleware, (req, res) => paymentController.createPayment(req, res));
router.get('/status/:paymentId', authMiddleware, (req, res) => paymentController.getPaymentStatus(req, res));
router.get('/history', authMiddleware, (req, res) => paymentController.getUserPayments(req, res));

// Webhook (без авторизации, но с проверкой IP или подписи)
router.post('/webhook', (req, res) => paymentController.webhook(req, res));

export default router;
