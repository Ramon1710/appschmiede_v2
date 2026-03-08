export const COIN_COSTS = {
  basicComponent: 0,
  component: 0.5,
  quickButton: 1,
  template: 30,
  ai: 15,
  page: 1,
} as const;

export type CoinActionKey = keyof typeof COIN_COSTS;
