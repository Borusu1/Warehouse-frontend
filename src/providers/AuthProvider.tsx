import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { UserSession } from '@/src/types/app';

const SESSION_STORAGE_KEY = 'warehouse.session';

type AuthContextValue = {
  isReady: boolean;
  session: UserSession | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

        if (rawSession && isMounted) {
          setSession(JSON.parse(rawSession) as UserSession);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      login: async (username: string, password: string) => {
        const normalizedUsername = username.trim().toLowerCase();

        if (normalizedUsername !== 'demo' || password !== 'demo123') {
          throw new Error('INVALID_CREDENTIALS');
        }

        const nextSession: UserSession = {
          id: 'demo-manager',
          displayName: 'Warehouse Manager',
          username: normalizedUsername,
        };

        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
      },
      logout: async () => {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
      },
    }),
    [isReady, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
