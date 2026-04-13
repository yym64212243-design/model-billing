'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { messages, type MessageTree } from '@/lib/messages';

export type Locale = 'zh' | 'en';

function pickMessages(locale: Locale): MessageTree {
  return messages[locale] as MessageTree;
}

const STORAGE_KEY = 'oc-billing-locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: MessageTree;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (s === 'en' || s === 'zh') setLocaleState(s);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: pickMessages(locale),
    }),
    [locale, setLocale]
  );

  if (!hydrated) {
    return (
      <LocaleContext.Provider value={{ locale: 'zh', setLocale, t: pickMessages('zh') }}>
        {children}
      </LocaleContext.Provider>
    );
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }
  return ctx;
}

export function useT() {
  return useLocaleContext().t;
}

export function useLocale() {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}
