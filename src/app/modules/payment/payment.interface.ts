export interface ICreateCheckoutSession {
  paymentType: 'one_time' | 'subscription';
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface IStripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}