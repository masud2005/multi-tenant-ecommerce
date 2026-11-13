import type { JwtSignOptions } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const generateTokens = (
  jwtService: JwtService,
  configService: ConfigService,
  payload: Record<string, unknown>,
) => {
  const accessToken = jwtService.sign(payload);
  const refreshExpiresIn = configService.get<string>(
    'REFRESH_TOKEN_EXPIRES_IN',
  );

  const refreshSecret = configService.get<string>(
    'jwt.refreshSecret',
  ) as string;
  const refreshToken = jwtService.sign(payload, {
    secret: refreshSecret,
    expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

export interface AccessTokenClaims {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string;
  sid?: string;
  purpose?: string;
}

export function readTokenClaims(value: unknown): AccessTokenClaims {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const text = (key: string) =>
    typeof record[key] === 'string' ? record[key] : undefined;
  return {
    sub: text('sub'),
    id: text('id'),
    email: text('email'),
    name: text('name'),
    role: text('role'),
    tenantId: text('tenantId'),
    sid: text('sid'),
    purpose: text('purpose'),
  };
}

export function textField(source: unknown, key: string): string | undefined {
  if (!source || typeof source !== 'object') return undefined;
  const value = (source as Record<string, unknown>)[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}
