import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { config } from "@/app/config";
import { tokenStorage } from "@/shared/auth/tokenStorage";
import type { AuthTokens } from "@/shared/auth/types";
import { endpoints } from "./endpoints";

export const axiosClient = axios.create({
  baseURL: config.apiUrl,
  headers: { "Content-Type": "application/json" },
});


const refreshClient = axios.create({
  baseURL: config.apiUrl,
  headers: { "Content-Type": "application/json" },
});

let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

axiosClient.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },
);

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await refreshClient.post<AuthTokens>(
    endpoints.auth.refresh,
    { refresh_token: refreshToken },
  );

  tokenStorage.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  return data.access_token;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = original?.url?.includes(endpoints.auth.refresh);

    if (!isUnauthorized || !original || original._retry || isRefreshCall) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization =
        `Bearer ${newToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      tokenStorage.clear();
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  },
);
