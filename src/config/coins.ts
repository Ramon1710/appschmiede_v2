export const COIN_COSTS = {
  basicComponent: 0,
  component: 0,
  quickButton: 0,
  template: 0,
  ai: 15,
  page: 0,
} as const;

export type CoinActionKey = keyof typeof COIN_COSTS;
