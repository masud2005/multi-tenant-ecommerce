import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') as string,
    });
  }

  async validate(payload: {
    sub: string;
    tenantId?: string;
    sid?: string;
    iat?: number;
  }) {
    const logoutTime = await this.redisService.get(
      `user_logout:${payload.sub}`,
    );
    if (
      logoutTime &&
      typeof payload.iat === 'number' &&
      payload.iat * 1000 < parseInt(logoutTime, 10)
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if (payload.sid) {
      const revoked = await this.redisService.get(
        `session_revoked:${payload.sid}`,
      );
      if (revoked) {
        throw new UnauthorizedException('Session has been revoked');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenantMemberships: {
          select: {
            tenantId: true,
            isOwner: true,
            roleId: true,
            role: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    let tenantId: string | undefined =
      payload.tenantId || user.tenantMemberships?.[0]?.tenantId;
    if (!tenantId) {
      const membership = await this.prisma.tenantMember.findFirst({
        where: { userId: user.id },
      });
      tenantId = membership?.tenantId;
      if (!tenantId) {
        const defaultTenant = await this.prisma.tenant.findFirst({
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
        tenantId = defaultTenant?.id;
      }
    }

    return {
      ...user,
      tenantId,
      sid: payload.sid || null,
    };
  }
}
