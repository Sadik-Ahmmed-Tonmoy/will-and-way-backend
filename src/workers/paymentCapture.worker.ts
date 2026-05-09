// import { Worker } from 'bullmq';
// import { redis } from '../lib/redis';
// import prisma from '../shared/prisma';
// import { BookingStatus } from '@prisma/client';
// import { stripe } from '../helpars/payment.utils';

// const paymentCaptureWorker = new Worker(
//   'paymentCapture',
//   async (job) => {
//     const { bookingId } = job.data;
//     console.log(`[Worker] Processing capture for booking ${bookingId}`);

//     const booking = await prisma.booking.findUnique({
//       where: { id: bookingId },
//       include: { payment: true, refundRequest: true },
//     });

//     if (!booking) {
//       throw new Error(`Booking ${bookingId} not found`);
//     }

//     if (
//       booking.status !== BookingStatus.CONFIRMED ||
//       booking.refundRequest?.status === 'PENDING'
//     ) {
//       console.log(`[Worker] Skipping booking ${bookingId} – not eligible`);
//       return;
//     }

//     if (!booking.payment?.stripePaymentIntentId) {
//       throw new Error(`No payment intent for booking ${bookingId}`);
//     }

//     try {
//       await stripe.paymentIntents.capture(booking.payment.stripePaymentIntentId);
//       await prisma.booking.update({
//         where: { id: bookingId },
//         data: {
//           status: BookingStatus.COMPLETED,
//           payment: { update: { status: 'SUCCESS' } },
//         },
//       });
//       console.log(`[Worker] Captured payment for booking ${bookingId}`);
//     } catch (error) {
//       console.error(`[Worker] Capture failed for booking ${bookingId}:`, error);
//       throw error;
//     }
//   },
//   {
//     connection: redis as any, // same cast as queue
//     concurrency: 5,
//   }
// );

// paymentCaptureWorker.on('completed', (job) => {
//   console.log(`[Worker] Job ${job.id} completed`);
// });

// paymentCaptureWorker.on('failed', (job, err) => {
//   console.error(`[Worker] Job ${job?.id} failed:`, err);
// });

// console.log('🚀 Payment capture worker started');

// // Export if needed elsewhere (e.g., for graceful shutdown)
// export { paymentCaptureWorker };