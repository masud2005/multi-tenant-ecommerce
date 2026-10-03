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
}

export const authService = new AuthService();
export {
  setAuthSession,
  clearAuthSession,
  getAuthToken,
  getRefreshToken,
  getAuthUser,
  getAuthRole,
  isAuthenticated,
};
