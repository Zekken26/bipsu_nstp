import prisma from '../../db/prisma.js';
import { emitUserEvent } from '../../websocket.js';

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function toPaymentResponse(payment, reused = false) {
  return {
    id: payment.id,
    amount: Number(payment.amount),
    currency: payment.currency,
    purpose: payment.purpose,
    targetEnrollmentId: payment.targetEnrollmentId,
    status: payment.status,
    providerStatus: 'NOT_CONFIGURED',
    reused,
  };
}

export async function createPaymentCharge(userId, { amount, currency, purpose, targetEnrollmentId }, idempotencyKey) {
  if (!userId || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    throw invalid('Invalid payment amount.');
  }
  if (currency !== 'PHP' || purpose !== 'ENROLLMENT_FEE') {
    throw invalid('Unsupported payment details.');
  }
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    throw invalid('A valid Idempotency-Key header is required.');
  }

  const [user, enrollment] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.enrollment.findFirst({ where: { id: targetEnrollmentId, student: { userId } }, select: { id: true } }),
  ]);
  if (!user) {
    const error = new Error('Account not found.');
    error.statusCode = 401;
    throw error;
  }
  if (!enrollment) {
    const error = new Error('Payment target not found.');
    error.statusCode = 404;
    throw error;
  }

  const existing = await prisma.payment.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } });
  if (existing) return toPaymentResponse(existing, true);

  let payment;
  try {
    payment = await prisma.payment.create({
      data: { userId, targetEnrollmentId, amount, currency, purpose, idempotencyKey, status: 'PENDING' },
    });
  } catch (error) {
    if (error?.code !== 'P2002') throw error;
    payment = await prisma.payment.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey } } });
    return toPaymentResponse(payment, true);
  }

  // No provider is configured. Only a verified provider webhook may transition this payment to CONFIRMED.
  emitUserEvent(userId, 'payment.updated', { paymentId: payment.id, status: payment.status });
  return toPaymentResponse(payment);
}
