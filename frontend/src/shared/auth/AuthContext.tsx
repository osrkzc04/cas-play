import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { axiosClient, setAuthFailureHandler } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import { tokenStorage } from "./tokenStorage";
import type { AuthTokens, AuthUser } from "./types";

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await axiosClient.get<AuthUser>(endpoints.auth.me);
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    tokenStorage.hasSession(),
  );

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // When the refresh flow ultimately fails, the axios layer calls this so the
  // React tree drops the authenticated state and route guards redirect to login.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    if (!tokenStorage.hasSession()) {
      setIsLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [clearSession]);

  const login = useCallback(async (input: LoginInput): Promise<AuthUser> => {
    const { data } = await axiosClient.post<AuthTokens>(
      endpoints.auth.login,
      input,
    );
    tokenStorage.set(data);
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    setUser(await fetchCurrentUser());
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      if (refreshToken) {
        await axiosClient.post(endpoints.auth.logout, {
          refresh_token: refreshToken,
        });
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
