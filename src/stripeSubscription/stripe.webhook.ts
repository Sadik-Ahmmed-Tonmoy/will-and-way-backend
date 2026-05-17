import express, { NextFunction, Request, Response } from 'express';
import { PaymentService } from '../app/modules/payment/payment.service';

const router = express.Router();

/**
 * POST /payment-webhook
 *
 * app.ts already mounts this with express.raw({ type: 'application/json' })
 * so req.body here is a raw Buffer — do NOT add express.json() to this router.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ message: 'Missing stripe-signature header' });
    return;
  }

  try {
    const result = await PaymentService.handleWebhook(req.body as Buffer, signature);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const WebhookRoutes = router;