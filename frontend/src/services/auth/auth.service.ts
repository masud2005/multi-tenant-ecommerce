// Authentication domain service integrating backend auth, OTP, and password lifecycle
import { apiClient } from '../api-client';
import type {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthSessionData,
  StoredUser,
  UserRole,
  ApiResponse,
} from '@/types';
import {
  setAuthSession,
  clearAuthSession,
  getAuthToken,
  getRefreshToken,
  getAuthUser,
  getAuthRole,
  isAuthenticated,
  hasValidRefreshToken,
} from './auth.storage';

class AuthService {
  async register(data: RegisterInput): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/register', data);
  }

  async login(data: LoginInput): Promise<ApiResponse<AuthSessionData>> {
    const res = await apiClient.post<ApiResponse<AuthSessionData>>('/auth/login', data);
    if (res.data?.accessToken) {
      setAuthSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
    }
    return res;
  }

  async verifyOtp(data: VerifyOtpInput): Promise<ApiResponse<AuthSessionData>> {
    const res = await apiClient.post<ApiResponse<AuthSessionData>>('/auth/verify-otp', data);
    if (res.data?.accessToken) {
      setAuthSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
    }
    return res;
  }

  async resendOtp(data: ResendOtpInput): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/resend-otp', data);
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordInput): Promise<ApiResponse<AuthSessionData>> {
    const res = await apiClient.post<ApiResponse<AuthSessionData>>('/auth/reset-password', data);
    if (res.data?.accessToken) {
      setAuthSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
    }
    return res;
  }

  async changePassword(data: ChangePasswordInput): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>('/auth/change-password', data);
  }

  async logout(): Promise<void> {
    try {
      const token = getAuthToken();
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch {
      // Allow clean local logout even if server token invalidation fails
    } finally {
      clearAuthSession();
    }
  }

  // Session convenience accessors
  setSession(data: { accessToken: string; refreshToken?: string; user?: StoredUser }) {
    setAuthSession(data);
  }

  clearSession() {
    clearAuthSession();
  }

  getStoredToken(): string | null {
    return getAuthToken();
  }

  getStoredRefreshToken(): string | null {
    return getRefreshToken();
  }

  getStoredUser(): StoredUser | null {
    return getAuthUser();
  }

  getUserRole(): UserRole | null {
    return getAuthRole();
  }

  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  hasValidRefreshToken(): boolean {
    return hasValidRefreshToken();
  }

  async refreshToken(): Promise<string | null> {
    return apiClient.refreshToken();
  }

  async getMe(): Promise<ApiResponse<StoredUser>> {
    const res = await apiClient.get<ApiResponse<StoredUser>>('/auth/me');
    if (res.data) {
      const currentToken = getAuthToken() || '';
      const currentRefresh = getRefreshToken() || '';
      setAuthSession({
        accessToken: currentToken,
        refreshToken: currentRefresh,
        user: res.data,
      });
    }
    return res;
  }

  async updateProfile(data: { name?: string; phone?: string; district?: string; avatar?: string }): Promise<ApiResponse<StoredUser>> {
    const res = await apiClient.patch<ApiResponse<StoredUser>>('/auth/profile', data);
    if (res.data) {
      const currentToken = getAuthToken() || '';
      const currentRefresh = getRefreshToken() || '';
      setAuthSession({
        accessToken: currentToken,
        refreshToken: currentRefresh,
        user: res.data,
      });
    }
    return res;
  }

  async getSessions(): Promise<AuthDeviceSession[]> {
    const res = await apiClient.get<ApiResponse<AuthDeviceSession[]>>(
      '/auth/sessions',
    );
    return res?.data || [];
  }

  async revokeSession(
    sessionId: string,
  ): Promise<{ signedOutCurrent?: boolean } | null> {
    const res = await apiClient.delete<
      ApiResponse<{ signedOutCurrent?: boolean }>
    >(`/auth/sessions/${encodeURIComponent(sessionId)}`);
    return res?.data || null;
  }

  async revokeOtherSessions(): Promise<{ revokedCount?: number } | null> {
    const res = await apiClient.delete<ApiResponse<{ revokedCount?: number }>>(
      '/auth/sessions/others',
    );
    return res?.data || null;
  }
}

export type AuthDeviceSession = {
  id: string;
  deviceLabel: string;
  deviceType: string;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
};

export const authService = new AuthService();
export {
  setAuthSession,
  clearAuthSession,
  getAuthToken,
  getRefreshToken,
  getAuthUser,
  getAuthRole,
  isAuthenticated,
  hasValidRefreshToken,
};
