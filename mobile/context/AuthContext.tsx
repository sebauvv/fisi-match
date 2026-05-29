import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../types/student';

const USER_KEY = 'fisi-match-user';
const TOKEN_KEY = 'fisi-match-token';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  skipAuthRedirect: boolean;
  setSkipAuthRedirect: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Cuando es true, el AuthLayout NO redirige aunque isAuthenticated sea true.
  // Usado por el registro para que el paso 5 (Confirm) pueda mostrarse antes de ir a home.
  const [skipAuthRedirect, setSkipAuthRedirect] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([USER_KEY, TOKEN_KEY]).then(([userEntry, tokenEntry]) => {
      if (userEntry[1]) setUser(JSON.parse(userEntry[1]));
      if (tokenEntry[1]) setToken(tokenEntry[1]);
    }).finally(() => setIsLoading(false));
  }, []);

  const login = (userData: AuthUser, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);
    AsyncStorage.multiSet([
      [USER_KEY, JSON.stringify(userData)],
      [TOKEN_KEY, accessToken],
    ]);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY]);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user, isLoading, skipAuthRedirect, setSkipAuthRedirect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
