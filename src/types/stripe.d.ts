// src/types/stripe.d.ts
// Minimaler Stripe-Typshim fuer die im Projekt verwendeten APIs.
declare module 'stripe' {
  namespace Stripe {
    type MetadataParam = Record<string, string>;

    namespace Checkout {
      type SessionCreateParams = {
        mode: 'subscription' | 'payment';
        success_url: string;
        cancel_url: string;
        customer_email?: string;
        metadata?: MetadataParam;
        payment_method_types?: string[];
        line_items: Array<{
          price: string;
          quantity: number;
        }>;
        subscription_data?: {
          metadata?: MetadataParam;
        };
      };
    }
  }

  export default class Stripe {
    constructor(secretKey: string, opts?: any);

    checkout: {
      sessions: {
        create(params: Stripe.Checkout.SessionCreateParams): Promise<{
          url: string | null;
        }>;
      };
    };
  }
}
