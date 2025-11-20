export const COIN_COSTS = {
  generateMultiPageApp: 5,
  refactorPageWithAI: 2,
  generateImage: 1,
} as const;

export type CoinActionKey = keyof typeof COIN_COSTS;
