import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import path from 'path';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './app/routes';

import morgan from 'morgan';
import { WebhookRoutes } from './helpars/webhook.routes';
import { cancelTemplate } from './lib/stripe/cancelTemplete';
import { successTemplate } from './lib/stripe/successTemplete';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
 
import { bookingExpirationQueue } from './queues/bookingExpiration.queue';
import { captainHireExpirationQueue } from './queues/captainHireExpiration.queue';
import { messagePersistenceQueue } from './queues/messagePersistence.queue';
import { paymentCaptureQueue } from './queues/paymentCapture.queue';

// import { PaymentService } from "./app/modules/Payment/payment.service";

const app: Application = express();

app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:65347',
      'http://localhost:53284',
      'http://206.162.244.142',
    ],
    credentials: true,
  }),
);

app.use(
  '/payment-webhook',
  // express.raw({ type: 'application/json' }),
  WebhookRoutes,
);

// app.use('/webhook', WebhookRoutes);
//parser
// app.use(express.json());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send({
    Message: 'The server is running. . .',
  });
});
// Run every hour
// cron.schedule('0 * * * *', () => {
//   captureCompletedBookings();
// });

// cron.schedule('* * * * *', () => {
//   captureCompletedBookings();
// });

// app.use("/product-payment-success", async (req: Request, res: Response) => {
//    await PaymentService.handleProductPaymentSuccess( req.query as any, res);
// });

app.use('/payment-success', (req: Request, res: Response) => {
  res.send(successTemplate());
});

app.use('/cancel', (req: Request, res: Response) => {
  res.send(cancelTemplate());
});

app.use(morgan('dev'));
app.use('/api/v1', router);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [
    new BullMQAdapter(messagePersistenceQueue),
  ],
  serverAdapter,
});

// Mount the dashboard
app.use('/admin/queues', serverAdapter.getRouter());
app.use(globalErrorHandler);
app.use('/upload', express.static(path.join(__dirname, 'app', 'upload')));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

export default app;
