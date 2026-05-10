import { chargePayment } from '../../data/mock/mockDb.js';
import { publishEvent } from '../events/events.service.js';

export async function createPaymentCharge({ userId, amount, currency = 'PHP' }) {
  if (!userId || typeof amount !== 'number' || amount <= 0) {
    const error = new Error('Invalid payment payload');
    error.statusCode = 400;
    throw error;
  }

  const payment = await chargePayment({ userId, amount, currency });

  publishEvent('payment.succeeded', {
    paymentId: payment.id,
    userId,
    amount,
    currency,
    createdAt: payment.createdAt,
  });

  return payment;
}
