// Base HTTP API Client with auth refresh interceptor and FormData support
import type { ApiResponse } from '@/types';
import {
  getAuthToken,
  getRefreshToken,
  setAuthSession,
  clearAuthSession,
} from './auth/auth.storage';

export type { ApiResponse };

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }

  private onTokenRefreshed(newToken: string) {
    this.refreshSubscribers.forEach((callback) => callback(newToken));
    this.refreshSubscribers = [];
  }

  private onTokenRefreshFailed() {
    this.refreshSubscribers.forEach((callback) => callback(''));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuthSession();
        return null;
      }

      const json = await response.json();
      const newAccessToken = json.data?.accessToken;
      const newRefreshToken = json.data?.refreshToken || refreshToken;

      if (newAccessToken) {
        setAuthSession({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
        return newAccessToken;
      }
      return null;
    } catch {
      clearAuthSession();
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // Auto-detect multipart form data
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    // Set JSON content type only if not FormData and not already specified
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Attach credentials and tenant headers if on client
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const tenantSlug =
        localStorage.getItem('tenant_slug') ||
        window.location.hostname.split('.')[0];
      if (tenantSlug && tenantSlug !== 'localhost' && !headers['x-tenant-slug']) {
        headers['x-tenant-slug'] = tenantSlug;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized by attempting a token refresh
      if (
        response.status === 401 &&
        !isRetry &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/refresh-token')
      ) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const newToken = await this.tryRefreshToken();
          this.isRefreshing = false;

          if (newToken) {
            this.onTokenRefreshed(newToken);
            headers['Authorization'] = `Bearer ${newToken}`;
            return this.request<T>(endpoint, { ...options, headers }, true);
          } else {
            clearAuthSession();
            this.onTokenRefreshFailed();
          }
        } else {
          return new Promise<T>((resolve, reject) => {
            this.addRefreshSubscriber(async (newToken: string) => {
              try {
                if (!newToken) {
                  throw new Error('Unauthorized');
                }
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryRes = await this.request<T>(endpoint, { ...options, headers }, true);
                resolve(retryRes);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage =
          (typeof errorBody.message === 'string'
            ? errorBody.message
            : Array.isArray(errorBody.message)
            ? errorBody.message.join(', ')
            : null) ||
          errorBody.error ||
          `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, headers?: HeadersInit) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: HeadersInit) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any, headers?: HeadersInit) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, headers?: HeadersInit) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, headers?: HeadersInit) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
