// Domain contract types for authentication and session management
import type { StoredUser, UserRole } from './user';

export type OtpType = 'ACCOUNT_VERIFY' | 'PASSWORD_RESET';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  type: OtpType;
}

export interface ResendOtpInput {
  email: string;
  type: OtpType;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSessionData extends AuthTokens {
  user?: StoredUser;
  resetToken?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  role: UserRole;
  tenantId?: string;
  iat?: number;
  exp?: number;
}
