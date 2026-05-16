import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'relic_auth';

export type AuthUser = {
  id: number;
  username: string;
  is_admin: boolean;
  token: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (token: string, user: Omit<AuthUser, 'token'>) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof data.id === 'number' &&
      typeof data.username === 'string' &&
      typeof data.is_admin === 'boolean' &&
      typeof data.token === 'string'
    ) {
      return data as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

function persist(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore quota */
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStored);

  const login = useCallback((token: string, u: Omit<AuthUser, 'token'>) => {
    const full: AuthUser = { ...u, token };
    setUser(full);
    persist(full);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    persist(null);
  }, []);

  const isAuthenticated = user !== null;

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout, isAuthenticated }),
    [user, login, logout, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}