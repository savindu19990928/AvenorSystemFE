import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, Role, TokenResponse } from '../types/api';
import { apiRequest, SESSION_EXPIRED_EVENT, tokenStore } from '../utils/api';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | undefined;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(tokenStore.access() ? 'loading' : 'anonymous');

  const loadMe = useCallback(async () => {
    const data = await apiRequest<AuthUser | {user: AuthUser;}>('/api/auth/me/');
    const me = 'user' in data ? data.user : data;
    setUser(me);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    if (!tokenStore.access()) return;
    loadMe().catch(() => {
      tokenStore.clear();
      setStatus('anonymous');
    });
  }, [loadMe]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus('anonymous');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await apiRequest<TokenResponse>('/api/auth/token/', {
        method: 'POST',
        body: { username, password },
        auth: false
      });
      tokenStore.set(data.access, data.refresh);
      if (data.user) {
        setUser(data.user);
        setStatus('authenticated');
      } else {
        await loadMe();
      }
    },
    [loadMe]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.user_type ?? user?.role;
    return {
      user,
      role,
      status,
      login,
      logout,
      hasRole: (...roles: Role[]) => !!role && roles.includes(role)
    };
  }, [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}