import { createContext, useContext, useState, useCallback } from 'react';
import { translate, LANGUAGES } from '../i18n/translations';

export { LANGUAGES };

const LanguageContext = createContext();
const STORAGE_KEY = 'dm-language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && LANGUAGES[saved] ? saved : 'en';
  });

  const setLanguage = useCallback((code) => {
    if (!LANGUAGES[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLanguageState(code);
    document.documentElement.setAttribute('lang', code);
  }, []);

  const t = useCallback((key) => translate(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
