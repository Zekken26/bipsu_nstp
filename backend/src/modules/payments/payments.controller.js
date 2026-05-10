import { createPaymentCharge } from './payments.service.js';

export async function chargePaymentController(req, res) {
  const payment = await createPaymentCharge(req.body || {});
  res.setHeader('Cache-Control', 'no-store');
  return res.status(201).json(payment);
}
