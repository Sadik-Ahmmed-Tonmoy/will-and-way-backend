import Stripe from "stripe";
import config from "../../config";

// export const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
//     apiVersion: '2025-08-27.basil'
// })

let stripe: Stripe | null = null;

if (config.stripe.stripe_secret_key) {
  stripe = new Stripe(config.stripe.stripe_secret_key as string, {
    apiVersion: '2025-08-27.basil'
})
} else {
  console.warn("⚠️ Stripe not configured");
}

export default stripe;