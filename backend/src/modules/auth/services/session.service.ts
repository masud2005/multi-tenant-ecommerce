import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { generateTokens } from '../utils/token.util';
import { parseUserAgent } from '../utils/device.util';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private refreshTtlSeconds() {
    const refreshExpiresInStr =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '30d';
    return refreshExpiresInStr.includes('d')
      ? parseInt(refreshExpiresInStr, 10) * 24 * 60 * 60
      : 30 * 24 * 60 * 60;
  }

  private accessRevokeTtlSeconds() {
    // Keep revoked flag at least as long as a typical access token
    return 60 * 60;
  }

  async issueTokens(
    payload: Record<string, any>,
    meta?: { userAgent?: string | null; ipAddress?: string | null },
  ) {
    const userId = payload.sub as string;
    const device = parseUserAgent(meta?.userAgent);

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        deviceLabel: device.deviceLabel,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        ipAddress: meta?.ipAddress || null,
        userAgent: meta?.userAgent || null,
        lastActiveAt: new Date(),
      },
    });

    const tokenPayload = { ...payload, sid: session.id };
    const { accessToken, refreshToken } = generateTokens(
      this.jwtService,
      this.configService,
      tokenPayload,
    );

    const ttl = this.refreshTtlSeconds();
    await this.redisService.set(
      `refresh_token:session:${session.id}`,
      refreshToken,
      ttl,
    );
    await this.redisService.set(`session_active:${session.id}`, userId, ttl);

    return { accessToken, refreshToken, sessionId: session.id };
  }

  async rotateRefreshToken(
    sessionId: string,
    userId: string,
    oldRefreshToken: string,
    payload: Record<string, any>,
  ) {
    const stored = await this.redisService.get(
      `refresh_token:session:${sessionId}`,
    );
    const prev = await this.redisService.get(
      `refresh_token_prev:session:${sessionId}`,
    );

    if (
      !stored ||
      (stored !== oldRefreshToken && prev !== oldRefreshToken)
    ) {
      // Backward-compatible: legacy single-token key
      const legacy = await this.redisService.get(`refresh_token:${userId}`);
      const legacyPrev = await this.redisService.get(
        `refresh_token_prev:${userId}`,
      );
      if (
        !legacy ||
        (legacy !== oldRefreshToken && legacyPrev !== oldRefreshToken)
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }

    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });
    if (!session && stored) {
      throw new UnauthorizedException('Session has been revoked');
    }

    const tokenPayload = { ...payload, sid: sessionId };
    const { accessToken, refreshToken } = generateTokens(
      this.jwtService,
      this.configService,
      tokenPayload,
    );

    const ttl = this.refreshTtlSeconds();
    await this.redisService.set(
      `refresh_token_prev:session:${sessionId}`,
      oldRefreshToken,
      15,
    );
    await this.redisService.set(
      `refresh_token:session:${sessionId}`,
      refreshToken,
      ttl,
    );
    await this.redisService.set(`session_active:${sessionId}`, userId, ttl);

    if (session) {
      await this.prisma.authSession.update({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() },
      });
    }

    return { accessToken, refreshToken, sessionId };
  }

  /** Legacy refresh path when JWT has no sid (pre-session tokens). */
  async rotateLegacyRefreshToken(
    userId: string,
    oldRefreshToken: string,
    payload: Record<string, any>,
  ) {
    const stored = await this.redisService.get(`refresh_token:${userId}`);
    const prev = await this.redisService.get(`refresh_token_prev:${userId}`);
    if (
      !stored ||
      (stored !== oldRefreshToken && prev !== oldRefreshToken)
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Upgrade legacy login into a proper session on refresh
    return this.issueTokens(payload);
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (!session.revokedAt) {
      await this.prisma.authSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    }
    await this.redisService.del(`refresh_token:session:${sessionId}`);
    await this.redisService.del(`refresh_token_prev:session:${sessionId}`);
    await this.redisService.del(`session_active:${sessionId}`);
    await this.redisService.set(
      `session_revoked:${sessionId}`,
      '1',
      this.accessRevokeTtlSeconds(),
    );
  }

  async logoutCurrent(userId: string, sessionId?: string | null) {
    if (sessionId) {
      await this.revokeSession(sessionId, userId).catch(() => undefined);
    } else {
      // Legacy full logout
      await this.redisService.del(`refresh_token:${userId}`);
      await this.redisService.del(`refresh_token_prev:${userId}`);
      await this.redisService.set(
        `user_logout:${userId}`,
        Date.now().toString(),
        15 * 60,
      );
    }
  }

  async listSessions(userId: string, currentSessionId?: string | null) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceLabel: true,
        deviceType: true,
        browser: true,
        os: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return ResponseHelper.success(
      sessions.map((s) => ({
        ...s,
        isCurrent: Boolean(currentSessionId && s.id === currentSessionId),
      })),
      'Sessions retrieved',
    );
  }

  async revokeOne(userId: string, sessionId: string, currentSessionId?: string | null) {
    await this.revokeSession(sessionId, userId);
    const signedOutCurrent = Boolean(
      currentSessionId && currentSessionId === sessionId,
    );
    return ResponseHelper.success(
      { signedOutCurrent },
      signedOutCurrent
        ? 'Signed out of this device'
        : 'Device signed out successfully',
    );
  }

  async revokeOthers(userId: string, currentSessionId?: string | null) {
    const others = await this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
      },
      select: { id: true },
    });

    await Promise.all(
      others.map((s) => this.revokeSession(s.id, userId).catch(() => undefined)),
    );

    // Also clear legacy single-token key so old devices cannot refresh
    await this.redisService.del(`refresh_token:${userId}`);
    await this.redisService.del(`refresh_token_prev:${userId}`);

    return ResponseHelper.success(
      { revokedCount: others.length },
      others.length
        ? `Signed out of ${others.length} other device${others.length === 1 ? '' : 's'}`
        : 'No other active devices',
    );
  }

  async assertSessionActive(sessionId?: string | null) {
    if (!sessionId) return;
    const revoked = await this.redisService.get(`session_revoked:${sessionId}`);
    if (revoked) {
      throw new UnauthorizedException('Session has been revoked');
    }
  }
}
