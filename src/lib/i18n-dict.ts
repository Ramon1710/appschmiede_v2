// src/lib/i18n-dict.ts
export const dict = {
  de: {
    hello: 'Hallo',
    welcome: 'Willkommen bei AppSchmiede',
    toggle_lang: 'Sprache wechseln',
  },
  en: {
    hello: 'Hello',
    welcome: 'Welcome to AppSchmiede',
    toggle_lang: 'Switch language',
  },
};

export type Lang = keyof typeof dict;
