import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  canAccessAdmin,
  clearSession,
  getAccessToken,
  getCurrentUser,
  saveSession,
  updateCurrentUser,
} from './session';
import { parabaService } from './parabaService';
import type { SessionUser } from './types';

type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, senha: string) => Promise<void>;
  acceptSession: (payload: { accessToken: string; user: SessionUser }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setUser: (user: SessionUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(() => getCurrentUser());
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [ready] = useState(true);

  const login = useCallback(async (email: string, senha: string) => {
    const payload = await parabaService.login(email.trim().toLowerCase(), senha);
    if (!canAccessAdmin(payload.user)) {
      clearSession();
      throw new Error('Acesso restrito a professores e alunos.');
    }
    saveSession(payload);
    setToken(payload.accessToken);
    setUserState(payload.user);
  }, []);

  const acceptSession = useCallback((payload: { accessToken: string; user: SessionUser }) => {
    if (!canAccessAdmin(payload.user)) {
      clearSession();
      throw new Error('Acesso restrito a professores e alunos.');
    }
    saveSession(payload);
    setToken(payload.accessToken);
    setUserState(payload.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUserState(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await parabaService.obterMeuPerfil();
    updateCurrentUser(profile);
    setUserState(profile);
  }, []);

  const setUser = useCallback((next: SessionUser) => {
    updateCurrentUser(next);
    setUserState(next);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, acceptSession, logout, refreshProfile, setUser }),
    [user, token, ready, login, acceptSession, logout, refreshProfile, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
