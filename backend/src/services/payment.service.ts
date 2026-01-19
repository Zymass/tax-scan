import { prisma } from '../db';

// Функция для ленивой загрузки YooKassa SDK
function getYooCheckout(): any {
  try {
    // @ts-ignore - динамический require
    const yookassaModule = require('@yookassa/sdk');
    return yookassaModule?.YooCheckout || null;
  } catch (error: any) {
    // Пакет не установлен - это нормально
    return null;
  }
}

export interface CreatePaymentData {
  userId: string;
  amount: number;
  calculationsCount: number; // Количество расчетов для покупки
}

export class PaymentService {
  private checkout: any;

  constructor() {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    // Ленивая загрузка YooKassa SDK
    const YooCheckoutClass = getYooCheckout();

    if (!YooCheckoutClass || !shopId || !secretKey) {
      if (!YooCheckoutClass) {
        console.log('ℹ️  @yookassa/sdk not installed. Payment functionality is disabled.');
      } else {
        console.warn('⚠️  YooKassa credentials not provided. Payment functionality is disabled.');
      }
      this.checkout = null;
    } else {
      this.checkout = new YooCheckoutClass({
        shopId,
        secretKey
      });
    }
  }

  async createPayment(data: CreatePaymentData) {
    const { userId, amount, calculationsCount } = data;

    // Проверяем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Создаем запись о платеже в БД
    const payment = await prisma.payment.create({
      data: {
        user_id: userId,
        amount,
        currency: 'RUB',
        status: 'pending',
        calculations_added: calculationsCount,
        metadata: JSON.stringify({ calculationsCount })
      }
    });

    // Если YooKassa не настроен, возвращаем тестовый платеж
    if (!this.checkout) {
      return {
        id: payment.id,
        payment_id: `test_${payment.id}`,
        confirmation_url: null,
        status: 'pending'
      };
    }

    try {
      // Создаем платеж в YooKassa
      const createPayload = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`
        },
        description: `Покупка ${calculationsCount} дополнительных расчетов`,
        metadata: {
          payment_id: payment.id,
          user_id: userId,
          calculations_count: calculationsCount.toString()
        }
      };

      const paymentResponse = await this.checkout.createPayment(createPayload);

      // Обновляем payment_id в БД
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          payment_id: paymentResponse.id
        }
      });

      return {
        id: payment.id,
        payment_id: paymentResponse.id,
        confirmation_url: paymentResponse.confirmation?.confirmation_url || null,
        status: paymentResponse.status
      };
    } catch (error: any) {
      // Обновляем статус на failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed'
        }
      });
      throw new Error(`Ошибка создания платежа: ${error.message}`);
    }
  }

  async handleWebhook(paymentId: string, event: string) {
    // Находим платеж по payment_id
    const payment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
      include: { user: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Обрабатываем событие
    if (event === 'payment.succeeded' && payment.status !== 'succeeded') {
      // Увеличиваем лимит расчетов пользователя
      await prisma.user.update({
        where: { id: payment.user_id },
        data: {
          calculations_limit: {
            increment: payment.calculations_added
          }
        }
      });

      // Обновляем статус платежа
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'succeeded',
          paid_at: new Date()
        }
      });

      return { success: true, message: 'Payment processed successfully' };
    } else if (event === 'payment.canceled' && payment.status !== 'canceled') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'canceled'
        }
      });
    }

    return { success: true, message: 'Webhook processed' };
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { payment_id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Если YooKassa настроен, проверяем актуальный статус
    if (this.checkout && payment.payment_id.startsWith('2')) {
      try {
        const paymentInfo = await this.checkout.getPayment(payment.payment_id);
        
        // Синхронизируем статус
        if (paymentInfo.status !== payment.status) {
          await this.handleWebhook(payment.payment_id, 
            paymentInfo.status === 'succeeded' ? 'payment.succeeded' : 
            paymentInfo.status === 'canceled' ? 'payment.canceled' : 'payment.pending'
          );
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }

    return payment;
  }

  async getUserPayments(userId: string) {
    return await prisma.payment.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
  }
}
