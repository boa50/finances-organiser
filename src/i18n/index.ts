import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enAU from './locales/en-AU.json';
import ptBR from './locales/pt-BR.json';

export const LANGUAGE_STORAGE_KEY = 'financecloud_language';

export type AppLanguage = 'en-AU' | 'pt-BR';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  shortLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'pt-BR', label: 'Português (BR)', shortLabel: 'BR' },
  { code: 'en-AU', label: 'English (AU)', shortLabel: 'EN' },
];

let inMemoryLang: AppLanguage = 'pt-BR';

export function getStoredLanguage(): AppLanguage {
  try {
    const storage = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

    if (storage) {
      const stored = storage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en-AU' || stored === 'pt-BR') {
        return stored;
      }
    }
  } catch (e) {
    console.warn('Failed to load language from localStorage:', e);
  }
  return inMemoryLang;
}

export function setStoredLanguage(lang: AppLanguage): void {
  inMemoryLang = lang;
  try {
    const storage = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

    if (storage) {
      storage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  } catch (e) {
    console.warn('Failed to save language to localStorage:', e);
  }
}

export async function changeAppLanguage(lang: AppLanguage): Promise<void> {
  setStoredLanguage(lang);
  await i18n.changeLanguage(lang);
}

export async function toggleAppLanguage(): Promise<AppLanguage> {
  const currentLang = i18n.language.startsWith('en') ? 'en-AU' : 'pt-BR';
  const nextLang: AppLanguage = currentLang === 'en-AU' ? 'pt-BR' : 'en-AU';
  await changeAppLanguage(nextLang);
  return nextLang;
}

const initialLang = getStoredLanguage();

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      'en-AU': { translation: enAU },
      'pt-BR': { translation: ptBR },
      en: { translation: enAU },
      pt: { translation: ptBR },
    },
    lng: initialLang,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
