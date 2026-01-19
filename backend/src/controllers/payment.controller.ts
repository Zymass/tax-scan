import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  private paymentService = new PaymentService();

  async createPayment(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { calculationsCount } = req.body;

      if (!calculationsCount || calculationsCount < 1) {
        return res.status(400).json({ error: 'Invalid calculations count' });
      }

      // Цена за расчет (можно вынести в конфиг)
      const pricePerCalculation = parseFloat(process.env.PRICE_PER_CALCULATION || '100');
      const amount = calculationsCount * pricePerCalculation;

      const payment = await this.paymentService.createPayment({
        userId: req.userId,
        amount,
        calculationsCount
      });

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async webhook(req: Request, res: Response) {
    try {
      const { event, object } = req.body;

      if (event === 'payment.succeeded' || event === 'payment.canceled') {
        const paymentId = object.id;
        await this.paymentService.handleWebhook(paymentId, event);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const payment = await this.paymentService.getPaymentStatus(paymentId);
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserPayments(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const payments = await this.paymentService.getUserPayments(req.userId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
