import type { AuthTokens } from "./types";

const ACCESS_KEY = "cas.access_token";
const REFRESH_KEY = "cas.refresh_token";

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: Pick<AuthTokens, "access_token" | "refresh_token">): void {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  },
  setAccess(accessToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  hasSession(): boolean {
    return Boolean(localStorage.getItem(ACCESS_KEY));
  },
};
