import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import az from '@/locales/az.json';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

export const STORAGE_KEY = 'relic-app-lang';

export const resources = {
  en: { translation: en },
  az: { translation: az },
  zh: { translation: zh },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'az', 'zh'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
