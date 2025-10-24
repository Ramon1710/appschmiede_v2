// src/types/stripe.d.ts
// (kleiner Shim, damit TS nicht meckert, auch wenn das Paket noch nicht installiert ist)
declare module 'stripe' {
  export default class Stripe {
    constructor(secretKey: string, opts?: any);
  }
}
