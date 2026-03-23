import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { i18n, setI18nLocale } from '@/src/i18n';
import { LocaleCode } from '@/src/types/app';

const LOCALE_STORAGE_KEY = 'warehouse.locale';

type LocaleContextValue = {
  isReady: boolean;
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => Promise<void>;
  t: typeof i18n.t;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveDefaultLocale(): LocaleCode {
  const deviceLocale = getLocales()[0]?.languageCode;

  return deviceLocale === 'en' ? 'en' : 'uk';
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<LocaleCode>('uk');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreLocale() {
      try {
        const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        const nextLocale = storedLocale === 'en' || storedLocale === 'uk' ? storedLocale : resolveDefaultLocale();

        setI18nLocale(nextLocale);

        if (isMounted) {
          setLocaleState(nextLocale);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    restoreLocale();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      isReady,
      locale,
      setLocale: async (nextLocale: LocaleCode) => {
        setI18nLocale(nextLocale);
        await AsyncStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        setLocaleState(nextLocale);
      },
      t: i18n.t.bind(i18n),
    }),
    [isReady, locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useI18n must be used within LocaleProvider');
  }

  return context;
}
