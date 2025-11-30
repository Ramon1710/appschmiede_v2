import type { AppPlanId } from '@/types/user';

const env = (key: string) => process.env[key] ?? null;

export type PlanConfig = {
  label: string;
  monthlyPriceEur: number;
  stripePriceId: string | null;
  includedCoinsPerMonth: number;
  maxProjects: number;
};

export const PLAN_CONFIG: Record<AppPlanId, PlanConfig> = {
  free: {
    label: 'Ohne Abo',
    monthlyPriceEur: 0,
    stripePriceId: null,
    includedCoinsPerMonth: 0,
    maxProjects: 1,
  },
  starter: {
    label: 'Spar Abo',
    monthlyPriceEur: 9.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_SPAR_ABO'),
    includedCoinsPerMonth: 80,
    maxProjects: 3,
  },
  pro: {
    label: 'Standard Abo',
    monthlyPriceEur: 19.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ABO'),
    includedCoinsPerMonth: 150,
    maxProjects: 6,
  },
  business: {
    label: 'Premium',
    monthlyPriceEur: 59.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_ABO'),
    includedCoinsPerMonth: 0,
    maxProjects: 9999,
  },
};

export type CoinPackageKey = 'coins_50' | 'coins_80' | 'coins_100' | 'coins_150' | 'coins_300';

export type CoinPackageConfig = {
  label: string;
  coins: number;
  priceEur: number;
  stripePriceId: string | null;
};

export const COIN_PACKAGES: Record<CoinPackageKey, CoinPackageConfig> = {
  coins_50: {
    label: '50 Coins',
    coins: 50,
    priceEur: 6.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_50'),
  },
  coins_80: {
    label: '80 Coins',
    coins: 80,
    priceEur: 8.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_80'),
  },
  coins_100: {
    label: '100 Coins',
    coins: 100,
    priceEur: 9.49,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_100'),
  },
  coins_150: {
    label: '150 Coins',
    coins: 150,
    priceEur: 13.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_150'),
  },
  coins_300: {
    label: '300 Coins',
    coins: 300,
    priceEur: 26.99,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_300'),
  },
};

export function findPlanByPriceId(priceId: string | null): AppPlanId | null {
  if (!priceId) return null;
  const entry = (Object.entries(PLAN_CONFIG) as Array<[AppPlanId, PlanConfig]>).find(([, cfg]) => cfg.stripePriceId === priceId);
  return entry ? entry[0] : null;
}

export function findCoinPackageByPriceId(priceId: string | null): CoinPackageKey | null {
  if (!priceId) return null;
  const entry = (Object.entries(COIN_PACKAGES) as Array<[CoinPackageKey, CoinPackageConfig]>).find(([, cfg]) => cfg.stripePriceId === priceId);
  return entry ? entry[0] : null;
}

export function getPlanConfig(plan: AppPlanId): PlanConfig {
  return PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
}
