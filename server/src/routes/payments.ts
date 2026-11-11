import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  activateBoostController,
  confirmPaymentController,
  createOrderController,
  getEntitlementsController,
  getPlansController,
  webhookController,
} from '../controllers/payments.js';
import { auth, validate } from '../middlewares/index.js';
import { confirmPaymentSchema, createOrderSchema } from '../validators/payments.js';

/** Each order is a live provider call: 10 / 15 min per IP is plenty for a human. */
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many checkout attempts, try again in a few minutes' },
});

/** Activating is cheap but it spends a credit: stop a stuck button from burning several. */
const boostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Slow down a little' },
});

export const paymentsRouter = Router();

paymentsRouter.get('/plans', getPlansController);
paymentsRouter.post('/webhook', webhookController);

paymentsRouter.use(auth);
paymentsRouter.get('/me', getEntitlementsController);
paymentsRouter.post('/order', orderLimiter, validate(createOrderSchema), createOrderController);
paymentsRouter.post('/confirm', orderLimiter, validate(confirmPaymentSchema), confirmPaymentController);
paymentsRouter.post('/boost/activate', boostLimiter, activateBoostController);
