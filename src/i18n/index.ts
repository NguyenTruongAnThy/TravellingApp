import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import vi from './locales/vi.json';
import en from './locales/en.json';

export const LANGUAGE_STORAGE_KEY = '@wanderstay_language';

const resources = {
  vi: { translation: vi },
  en: { translation: en },
};

// Initialize i18next with Tiếng Việt as default
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Ngôn ngữ mặc định theo lựa chọn của người dùng
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

// Load previously saved language preference from AsyncStorage
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then((savedLang) => {
    if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
      i18n.changeLanguage(savedLang);
    }
  })
  .catch((err) => {
    console.warn('Could not load saved language:', err);
  });

/**
 * Switch application language and persist choice to AsyncStorage
 */
export async function changeAppLanguage(lang: 'vi' | 'en'): Promise<void> {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (err) {
    console.warn('Error saving language preference:', err);
  }
}

export default i18n;
