import { createPaymentCharge } from './payments.service.js';

export async function chargePaymentController(req, res) {
  const payment = await createPaymentCharge(req.user.id, req.validated.body, req.get('Idempotency-Key'));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(payment.reused ? 200 : 202).json(payment);
}
