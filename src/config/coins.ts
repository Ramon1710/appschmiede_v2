export const COIN_COSTS = {
  component: 1,
  template: 40,
  ai: 15,
  page: 1,
} as const;

export type CoinActionKey = keyof typeof COIN_COSTS;
