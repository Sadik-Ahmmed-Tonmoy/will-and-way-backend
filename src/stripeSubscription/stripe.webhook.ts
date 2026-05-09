// // stripe.webhook.ts - UPDATED WITH BETTER PLAN LOOKUP
// import Stripe from 'stripe';
// import config from '../config';
// import { subscriptionPlanService } from '../app/modules/SubscriptionPlan/subscriptionPlan.service';
// import catchAsync from '../app/utils/catchAsync';
// import prisma from '../shared/prisma';

// const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
//   apiVersion: '2025-08-27.basil',
// });

// // Helper function to extract metadata
// const extractMetadata = (metadata: Stripe.Metadata | null) => {
//   if (!metadata) return undefined;

//   return {
//     userId: metadata.userId || undefined,
//     subscriptionPlanId: metadata.subscriptionPlanId || undefined,
//     previousPlanId: metadata.previousPlanId || undefined,
//     oldSubscriptionId: metadata.oldSubscriptionId || undefined,
//     refundAmount: metadata.refundAmount || undefined,
//     creditAmount: metadata.creditAmount || undefined,
//     isPlanChange: metadata.isPlanChange === 'true',
//     changeType: metadata.changeType,
//   };
// };

// // Helper function to safely convert Stripe timestamp to Date
// const stripeTimestampToDate = (timestamp: number | null | undefined): Date => {
//   if (!timestamp) return new Date();
  
//   try {
//     return new Date(timestamp * 1000);
//   } catch (error) {
//     console.warn(`Invalid timestamp: ${timestamp}, using current date`);
//     return new Date();
//   }
// };

// // Helper function to find plan by price ID or metadata
// const findPlanForSubscription = async (
//   stripeSubscription: Stripe.Subscription,
//   metadata?: any
// ) => {
//   // Try to get price ID from subscription
//   const currentPriceId = stripeSubscription.items.data[0]?.price?.id;
  
//   if (currentPriceId) {
//     // First, try to find plan by stripePriceId
//     const planByPriceId = await prisma.subscriptionPlan.findFirst({
//       where: { stripePriceId: currentPriceId },
//     });
    
//     if (planByPriceId) {
//       console.log(`Found plan by price ID: ${planByPriceId.id} `);
//       return planByPriceId;
//     }
//   }

//   // Try metadata
//   if (metadata?.subscriptionPlanId) {
//     const planByMetadata = await prisma.subscriptionPlan.findUnique({
//       where: { id: metadata.subscriptionPlanId },
//     });
    
//     if (planByMetadata) {
//       console.log(`Found plan by metadata: ${planByMetadata.id} `);
//       return planByMetadata;
//     }
//   }

//   // Try subscription metadata
//   if (stripeSubscription.metadata?.subscriptionPlanId) {
//     const planBySubMetadata = await prisma.subscriptionPlan.findUnique({
//       where: { id: stripeSubscription.metadata.subscriptionPlanId },
//     });
    
//     if (planBySubMetadata) {
//       console.log(`Found plan by subscription metadata: ${planBySubMetadata.id} `);
//       return planBySubMetadata;
//     }
//   }

//   // Try to find plan by product ID
//   const productId = stripeSubscription.items.data[0]?.price?.product;
//   if (productId && typeof productId === 'string') {
//     const planByProductId = await prisma.subscriptionPlan.findFirst({
//       where: { stripeProductId: productId },
//     });
    
//     if (planByProductId) {
//       console.log(`Found plan by product ID: ${planByProductId.id} `);
//       return planByProductId;
//     }
//   }

//   console.warn('Plan not found for subscription:', {
//     subscriptionId: stripeSubscription.id,
//     priceId: currentPriceId,
//     productId,
//     metadata: metadata,
//     subscriptionMetadata: stripeSubscription.metadata,
//   });
  
//   return null;
// };

// // Helper function to find user for subscription
// const findUserForSubscription = async (
//   stripeCustomerId: string | Stripe.Customer | null | undefined,
//   metadata?: any
// ) => {
//   let customerId: string | null = null;
  
//   if (typeof stripeCustomerId === 'string') {
//     customerId = stripeCustomerId;
//   } else if (stripeCustomerId && typeof stripeCustomerId === 'object') {
//     customerId = stripeCustomerId.id;
//   }

//   // Try by stripeCustomerId
//   if (customerId) {
//     const userByCustomerId = await prisma.user.findFirst({
//       where: { stripeCustomerId: customerId },
//     });
    
//     if (userByCustomerId) {
//       console.log(`Found user by customer ID: ${userByCustomerId.id} - ${userByCustomerId.email}`);
//       return userByCustomerId;
//     }
//   }

//   // Try by metadata
//   if (metadata?.userId) {
//     const userByMetadata = await prisma.user.findUnique({
//       where: { id: metadata.userId },
//     });
    
//     if (userByMetadata) {
//       console.log(`Found user by metadata: ${userByMetadata.id} - ${userByMetadata.email}`);
//       return userByMetadata;
//     }
//   }

//   console.warn('User not found for subscription:', {
//     customerId,
//     metadata: metadata,
//   });
  
//   return null;
// };

// const handleWebHook = catchAsync(async (req: any, res: any) => {
//   console.log("inside");
//   const sig = req.headers['stripe-signature'] as string;
//   if (!sig) {
//     console.error('Missing Stripe signature header');
//     return res.status(400).send('Missing signature');
//   }

//   let event: Stripe.Event;
//   try {
//     console.log('Verifying webhook signature...');
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       config.stripe.webhookSecret as string,
//     );
//     console.log(`Webhook verified: ${event.type} - ${event.id}`);
//   } catch (err: any) {
//     console.error('Webhook signature verification failed:', err.message);
    
//     // Log the raw body for debugging
//     console.log('Raw body (first 500 chars):', req.body.toString().substring(0, 500));
//     console.log('Headers:', req.headers);
    
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     console.log(`Processing webhook event: ${event.type}`);
    
//     switch (event.type) {
//       case 'checkout.session.completed': {
//         const session = event.data.object as Stripe.Checkout.Session;
//         console.log(`Checkout session completed: ${session.id}, mode: ${session.mode}`);

//         if (session.mode === 'subscription' && session.subscription) {
//           const subscriptionId = session.subscription as string;
//           try {
//             console.log(`Retrieving subscription: ${subscriptionId}`);
//             const subscription = await stripe.subscriptions.retrieve(subscriptionId);
//             const metadata = extractMetadata(session.metadata);

//             console.log(`Syncing subscription to DB: ${subscriptionId}`);
//             const result = await subscriptionPlanService.syncStripeSubscriptionToDB(subscription, metadata);
            
//             if (result) {
//               console.log(`Successfully synced subscription: ${result.id}`);
//             } else {
//               console.warn(`Failed to sync subscription: ${subscriptionId}`);
//             }
//           } catch (error: any) {
//             console.error(`Failed to process subscription ${subscriptionId}:`, error.message);
//           }
//         }
//         break;
//       }

//       case 'customer.subscription.updated': {
//         const subscription = event.data.object as Stripe.Subscription;
//         console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        
//         try {
//           const metadata = extractMetadata(subscription.metadata);
//           const result = await subscriptionPlanService.syncStripeSubscriptionToDB(subscription, metadata);
          
//           if (result) {
//             console.log(`Successfully updated subscription: ${result.id}`);
//           } else {
//             console.warn(`Failed to update subscription: ${subscription.id}`);
//           }
//         } catch (error: any) {
//           console.error(`Failed to sync subscription ${subscription.id}:`, error.message);
//         }
//         break;
//       }

//       case 'customer.subscription.created': {
//         const subscription = event.data.object as Stripe.Subscription;
//         console.log(`Subscription created: ${subscription.id}`);
        
//         try {
//           const metadata = extractMetadata(subscription.metadata);
//           const result = await subscriptionPlanService.syncStripeSubscriptionToDB(subscription, metadata);
          
//           if (result) {
//             console.log(`Successfully created subscription: ${result.id}`);
//           }
//         } catch (error: any) {
//           console.error(`Failed to create subscription ${subscription.id}:`, error.message);
//         }
//         break;
//       }

//       case 'invoice.paid': {
//         const invoice = event.data.object as any;
//         const stripeSubscriptionId = invoice.subscription;
        
//         if (stripeSubscriptionId) {
//           console.log(`Invoice paid for subscription: ${stripeSubscriptionId}`);
          
//           try {
//             const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
//             const metadata = extractMetadata(invoice.metadata || subscription.metadata);

//             const result = await subscriptionPlanService.syncStripeSubscriptionToDB(subscription, metadata);
            
//             if (result) {
//               console.log(`Successfully processed paid invoice for subscription: ${result.id}`);
//             }
//           } catch (error: any) {
//             console.error(`Failed to process paid invoice for subscription ${stripeSubscriptionId}:`, error.message);
//           }
//         }
//         break;
//       }

//       case 'invoice.payment_failed': {
//         const invoice = event.data.object as any;
//         const stripeSubscriptionId = invoice.subscription;

//         if (stripeSubscriptionId) {
//           console.log(`Payment failed for subscription: ${stripeSubscriptionId}`);
          
//           try {
//             await prisma.userSubscription.updateMany({
//               where: { stripeSubscriptionId },
//               data: { status: 'PAST_DUE' },
//             });
//             console.log(`Updated subscription ${stripeSubscriptionId} to PAST_DUE`);
//           } catch (error: any) {
//             console.error(`Failed to update failed payment for subscription ${stripeSubscriptionId}:`, error.message);
//           }
//         }
//         break;
//       }

//       case 'customer.subscription.deleted': {
//         const subscription = event.data.object as Stripe.Subscription;
//         const stripeSubscriptionId = subscription.id;
//         console.log(`Subscription deleted: ${stripeSubscriptionId}`);

//         try {
//           await prisma.userSubscription.updateMany({
//             where: { stripeSubscriptionId },
//             data: {
//               status: 'CANCELED',
//               cancelAtPeriodEnd: true,
//             },
//           });
//           console.log(`Updated subscription ${stripeSubscriptionId} to CANCELED`);
//         } catch (error: any) {
//           console.error(`Failed to update deleted subscription ${stripeSubscriptionId}:`, error.message);
//         }
//         break;
//       }

//       case 'charge.succeeded': {
//         const charge = event.data.object as Stripe.Charge;
//         console.log(`Charge succeeded: ${charge.id}, amount: ${charge.amount / 100}`);
        
//         try {
//           await prisma.transaction.create({
//             data: {
//               transactionId: charge.id,
//               userName: charge.billing_details?.name || '',
//               userEmail: charge.billing_details?.email || '',
//               serviceName: charge.metadata?.serviceName || 'Charge',
//               status: 'SUCCESS',
//               amount: charge.amount / 100,
//             },
//           });
//         } catch (error: any) {
//           console.error(`Failed to log charge ${charge.id}:`, error.message);
//         }
//         break;
//       }

//       case 'charge.failed': {
//         const charge = event.data.object as Stripe.Charge;
//         console.log(`Charge failed: ${charge.id}`);
        
//         try {
//           await prisma.transaction.create({
//             data: {
//               transactionId: charge.id,
//               userName: charge.billing_details?.name || '',
//               userEmail: charge.billing_details?.email || '',
//               serviceName: charge.metadata?.serviceName || 'Charge',
//               status: 'FAILED',
//               amount: charge.amount / 100,
//               errorMessage: charge.failure_message || 'Payment failed',
//             },
//           });
//         } catch (error: any) {
//           console.error(`Failed to log failed charge ${charge.id}:`, error.message);
//         }
//         break;
//       }

//       // Log but don't process these events
//       case 'customer.created':
//       case 'customer.updated':
//       case 'product.created':
//       case 'price.created':
//       case 'payment_intent.succeeded':
//       case 'payment_intent.created':
//       case 'invoice.created':
//       case 'invoice.finalized':
//       case 'payment_method.attached':
//       case 'invoice.payment_succeeded':
//         console.log(`Received ${event.type} event (logged only)`);
//         break;

//       default:
//         console.log(`Unhandled webhook event type: ${event.type}`);
//     }

//     res.status(200).send({ received: true, eventId: event.id });
//   } catch (err: any) {
//     console.error('Error processing webhook:', err);
//     res.status(500).send('Internal error');
//   }
// });

// export default handleWebHook;