export interface ISubscriptionPlan {
  id: string;
  name: string; // BASIC, PRO
  price: number;
  features: string[];
  isActive: boolean;
}

export interface IUpdatePaymentMethodPayload {
  paymentMethodToken: string;
  last4?: string;
  cardBrand?: string;
  expiryDate?: string;
}

export interface ISubscriptionRenewalPayload {
  vendorId: string;
  subscriptionTier: string;
  renewalDate: Date;
}

export interface ICreatePlanPayload {
  name: string;
  price: number;
  features: string[];
  isActive?: boolean;
}