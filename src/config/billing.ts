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
    label: 'Free',
    monthlyPriceEur: 0,
    stripePriceId: null,
    includedCoinsPerMonth: 20,
    maxProjects: 1,
  },
  starter: {
    label: 'Starter',
    monthlyPriceEur: 19,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_STARTER'),
    includedCoinsPerMonth: 300,
    maxProjects: 10,
  },
  pro: {
    label: 'Pro',
    monthlyPriceEur: 59,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_PRO'),
    includedCoinsPerMonth: 1500,
    maxProjects: 50,
  },
  business: {
    label: 'Business',
    monthlyPriceEur: 149,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_BUSINESS'),
    includedCoinsPerMonth: 5000,
    maxProjects: 9999,
  },
};

export type CoinPackageKey = 'coins_100' | 'coins_300' | 'coins_1000';

export type CoinPackageConfig = {
  label: string;
  coins: number;
  priceEur: number;
  stripePriceId: string | null;
};

export const COIN_PACKAGES: Record<CoinPackageKey, CoinPackageConfig> = {
  coins_100: {
    label: '100 Coins',
    coins: 100,
    priceEur: 9,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_100'),
  },
  coins_300: {
    label: '300 Coins',
    coins: 300,
    priceEur: 24,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_300'),
  },
  coins_1000: {
    label: '1000 Coins',
    coins: 1000,
    priceEur: 69,
    stripePriceId: env('NEXT_PUBLIC_STRIPE_PRICE_COINS_1000'),
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
