// import express from 'express';
// import auth from '../../middlewares/auth';
// import validateRequest from '../../middlewares/validateRequest';
// import { UserRole } from '@prisma/client';
// import { SubscriptionController } from './subscription.controller';
// import {
//   updatePaymentMethodValidation,
//   upgradeSubscriptionValidation,
//   cancelSubscriptionValidation,
//   createPlanValidation,
//   updatePlanValidation,
//   subscriptionFilterValidation,
// } from './subscription.validation';

// const router = express.Router();



// // Admin routes
// router.get(
//   '/admin/subscriptions',
//   auth(),
//   validateRequest(subscriptionFilterValidation),
//   SubscriptionController.getAllSubscriptions
// );

// router.get(
//   '/admin/plans',
//   auth(),
//   SubscriptionController.getPlans
// );

// router.post(
//   '/admin/plans',
//   auth(),
//   validateRequest(createPlanValidation),
//   SubscriptionController.createPlan
// );

// router.put(
//   '/admin/plans/:id',
//   auth(),
//   validateRequest(updatePlanValidation),
//   SubscriptionController.updatePlan
// );

// // Webhook (no auth, signature verification inside)
// router.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   SubscriptionController.handleWebhook
// );

// export const SubscriptionRoutes = router;