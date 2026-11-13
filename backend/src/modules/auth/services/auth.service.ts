import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import {
  UserRole,
  UserStatus,
  OtpType,
} from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { readTokenClaims } from '../utils/token.util';
import { OtpService } from './otp.service';
import {
  ConflictException,
  InvalidCredentialsException,
  UnauthorizedException,
} from '../../../common/exceptions/business.exception';

import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../../notification/notification.service';
import { SessionService } from './session.service';
import type { AuthRequestMeta } from '../types/auth-meta';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
    private readonly sessionService: SessionService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = this.configService.get<number>(
      'app.bcryptSaltRounds',
    ) as number;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    try {
      await this.otpService.sendOtp({
        email: user.email!,
        type: OtpType.ACCOUNT_VERIFY,
      });
    } catch (error) {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw error;
    }

    this.eventEmitter.emit('activity.log', {
      type: 'USER_REGISTERED',
      message: `${user.email} joined the platform`,
      metadata: { userId: user.id },
    });

    return ResponseHelper.created(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      'Registration successful. Please check your email for the verification code.',
    );
  }

  private phoneLookupValues(input: string): string[] {
    const trimmed = input.trim();
    const digits = trimmed.replace(/\D/g, '');
    const values = new Set<string>();
    if (trimmed) values.add(trimmed);
    if (digits) values.add(digits);
    if (digits.startsWith('880') && digits.length > 3) {
      values.add(`0${digits.slice(3)}`);
      values.add(`+${digits}`);
    } else if (digits.startsWith('0') && digits.length > 1) {
      values.add(`880${digits.slice(1)}`);
      values.add(`+880${digits.slice(1)}`);
    }
    return [...values];
  }

  private async findUserForLogin(dto: LoginDto) {
    const email = dto.email?.trim() || '';
    const phone = dto.phone?.trim() || '';
    const identifier = email || phone;
    if (!identifier) {
      throw new InvalidCredentialsException();
    }

    const loginInclude = {
      tenantMemberships: {
        include: {
          role: true,
          tenant: true,
        },
      },
    } as const;

    const looksLikeEmail = identifier.includes('@');
    if (looksLikeEmail) {
      return this.prisma.user.findFirst({
        where: { email: identifier, deletedAt: null },
        include: loginInclude,
      });
    }

    const phones = this.phoneLookupValues(phone || identifier);
    const matches = await this.prisma.user.findMany({
      where: { phone: { in: phones }, deletedAt: null },
      include: loginInclude,
    });
    return (
      matches.find((user) => user.phone === (phone || identifier)) ||
      matches[0] ||
      null
    );
  }

  async login(dto: LoginDto, meta?: AuthRequestMeta) {
    const user = await this.findUserForLogin(dto);
    if (!user || !user.password) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      if (user.email) {
        await this.otpService.sendOtp({
          email: user.email,
          type: OtpType.ACCOUNT_VERIFY,
        });
      }
      throw new UnauthorizedException(
        'Your account is not verified yet. We have sent a new OTP to your email. Please verify your account to continue.',
        user.email
          ? [
              {
                field: 'email',
                message: 'Verify this email',
                value: user.email,
              },
            ]
          : undefined,
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Your account is currently ${user.status}. Please contact support.`,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.eventEmitter.emit('activity.log', {
      type: 'USER_LOGIN',
      message: `${user.email} logged in`,
      metadata: { userId: user.id },
    });

    // Track customer login event for conversion rate analytics
    if (user.role === UserRole.CUSTOMER) {
      try {
        let targetTenantId: string | undefined =
          user.tenantMemberships?.[0]?.tenantId;
        if (!targetTenantId) {
          const profile = await this.prisma.customerProfile.findFirst({
            where: { userId: user.id, deletedAt: null },
            select: { tenantId: true },
          });
          targetTenantId = profile?.tenantId;
        }
        if (!targetTenantId) {
          const defaultTenant = await this.prisma.tenant.findFirst({
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          });
          targetTenantId = defaultTenant?.id;
        }
        if (targetTenantId) {
          await this.prisma.customerLoginLog.create({
            data: {
              tenantId: targetTenantId,
              userId: user.id,
              email: user.email,
            },
          });
        }
      } catch {
        // Non-blocking analytics log
      }
    }

    const membership = user.tenantMemberships?.[0];
    const tenantId = membership?.tenantId;
    const isOwner = Boolean(
      membership?.isOwner ||
      user.role === UserRole.OWNER ||
      String(user.role) === 'SUPER_ADMIN',
    );
    const isStaff = Boolean(membership && !isOwner);
    const staffRole = isOwner
      ? 'Owner'
      : isStaff
        ? membership?.role?.name || 'Staff'
        : undefined;
    const permissions =
      (membership?.role?.permissions as Record<string, string[]>) ||
      (isOwner ? { all: ['*'] } : {});
    const effectiveRole = isOwner ? 'OWNER' : isStaff ? 'STAFF' : user.role;

    // Calculate dynamic landing route for staff based on all modules
    const redirectUrl = isOwner
      ? '/admin'
      : isStaff
        ? this.resolveFirstAllowedRoute(permissions)
        : '/account';

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name || 'User',
      role: effectiveRole,
      tenantId,
      isOwner,
      staffRole,
      permissions,
    };
    const { accessToken, refreshToken } = await this.sessionService.issueTokens(
      payload,
      meta,
    );

    return ResponseHelper.success(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name || 'User',
          email: user.email,
          phone: user.phone || undefined,
          role: effectiveRole,
          tenantId,
          isOwner,
          staffRole,
          permissions,
        },
        redirectUrl,
      },
      'Login successful',
    );
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const refreshSecret = this.configService.get<string>(
        'jwt.refreshSecret',
      ) as string;
      const decoded = readTokenClaims(
        this.jwtService.verify(dto.refreshToken, {
          secret: refreshSecret,
        }),
      );
      if (!decoded.sub) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          tenantMemberships: true,
        },
      });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const membership = user.tenantMemberships?.[0];
      const tenantId = membership?.tenantId;
      const isOwner = Boolean(
        membership?.isOwner ||
        user.role === UserRole.OWNER ||
        String(user.role) === 'SUPER_ADMIN',
      );
      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name || 'User',
        role: user.role,
        tenantId,
        isOwner,
      };

      const tokens = decoded.sid
        ? await this.sessionService.rotateRefreshToken(
            decoded.sid,
            user.id,
            dto.refreshToken,
            payload,
          )
        : await this.sessionService.rotateLegacyRefreshToken(
            user.id,
            dto.refreshToken,
            payload,
          );

      return ResponseHelper.success(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || undefined,
            role: user.role,
            tenantId,
          },
        },
        'Token refreshed successfully',
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, sessionId?: string | null) {
    await this.sessionService.logoutCurrent(userId, sessionId);

    this.eventEmitter.emit('activity.log', {
      type: 'USER_LOGOUT',
      message: `User logged out`,
      metadata: { userId, sessionId },
    });

    return ResponseHelper.success(null, 'Logged out successfully');
  }

  listSessions(userId: string, currentSessionId?: string | null) {
    return this.sessionService.listSessions(userId, currentSessionId);
  }

  revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId?: string | null,
  ) {
    return this.sessionService.revokeOne(userId, sessionId, currentSessionId);
  }

  revokeOtherSessions(userId: string, currentSessionId?: string | null) {
    return this.sessionService.revokeOthers(userId, currentSessionId);
  }

  // Validate incoming staff invitation token
  async validateStaffInvite(token: string) {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Invitation token is required');
    }

    const member = await this.prisma.tenantMember.findFirst({
      where: { inviteToken: token, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!member) {
      throw new UnauthorizedException('Invalid or expired invitation link');
    }

    if (member.inviteExpiresAt && new Date() > member.inviteExpiresAt) {
      throw new UnauthorizedException(
        'This invitation has expired. Please ask the store owner for a new invite.',
      );
    }

    return ResponseHelper.success(
      {
        valid: true,
        email: member.user.email,
        name: member.user.name,
        roleName: member.role?.name || 'Staff Member',
        roleDescription: member.role?.description || null,
        storeName: member.tenant.name,
        storeSlug: member.tenant.slug,
        permissions: member.role?.permissions || {},
      },
      'Invitation is valid',
    );
  }

  // Accept staff invite, set password, and auto-login
  async acceptStaffInvite(
    dto: { token: string; password: string; name?: string },
    meta?: AuthRequestMeta,
  ) {
    const { token, password, name } = dto;
    if (!token) {
      throw new UnauthorizedException('Invitation token is required');
    }

    const member = await this.prisma.tenantMember.findFirst({
      where: { inviteToken: token, deletedAt: null },
      include: {
        user: true,
        role: true,
        tenant: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException('Invalid invitation link');
    }

    if (member.inviteExpiresAt && new Date() > member.inviteExpiresAt) {
      throw new UnauthorizedException(
        'This invitation has expired. Please ask the store owner for a new invite.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user record
    const updatedUser = await this.prisma.user.update({
      where: { id: member.userId },
      data: {
        password: hashedPassword,
        name: name?.trim() || member.user.name,
        status: UserStatus.ACTIVE,
        role: member.isOwner ? UserRole.OWNER : UserRole.STAFF,
        lastLoginAt: new Date(),
      },
    });

    // Activate membership and clear token
    await this.prisma.tenantMember.update({
      where: { id: member.id },
      data: {
        status: 'active',
        inviteToken: null,
        inviteExpiresAt: null,
        lastActiveAt: new Date(),
      },
    });

    const permissions =
      (member.role?.permissions as Record<string, string[]>) || {};
    const isOwner = Boolean(member.isOwner);
    const staffRole = member.role?.name || (isOwner ? 'Owner' : 'Staff');
    const effectiveRole = isOwner ? UserRole.OWNER : UserRole.STAFF;
    const redirectUrl = isOwner
      ? '/admin'
      : this.resolveFirstAllowedRoute(permissions);

    // Notify store owner that a staff member has accepted invite and joined (In-App)
    void (async () => {
      try {
        const ownerMembers = await this.prisma.tenantMember.findMany({
          where: { tenantId: member.tenantId, isOwner: true, deletedAt: null },
        });
        for (const owner of ownerMembers) {
          await this.notificationService.send({
            tenantId: member.tenantId,
            userId: owner.userId,
            title: `Staff Joined: ${updatedUser.name || 'Staff Member'}`,
            message: `${updatedUser.name || updatedUser.email} has accepted the invitation and joined as ${staffRole}.`,
            type: 'SYSTEM',
            link: `/admin/staff`,
          });
        }
      } catch {
        // Silently ignore notification dispatch errors
      }
    })();

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || 'Staff',
      role: effectiveRole,
      tenantId: member.tenantId,
      isOwner,
      staffRole,
      permissions,
    };

    const { accessToken, refreshToken } = await this.sessionService.issueTokens(
      payload,
      meta,
    );

    return ResponseHelper.success(
      {
        accessToken,
        refreshToken,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: effectiveRole,
          tenantId: member.tenantId,
          isOwner,
          staffRole,
          permissions,
        },
        store: {
          id: member.tenant.id,
          name: member.tenant.name,
          slug: member.tenant.slug,
        },
        redirectUrl,
      },
      `Welcome to ${member.tenant.name}! Your account is now active.`,
    );
  }

  // Helper to calculate first authorized landing route for staff
  private resolveFirstAllowedRoute(
    permissions: Record<string, string[]>,
  ): string {
    if (!permissions || typeof permissions !== 'object') return '/admin';

    const priorityOrder: Array<[string, string]> = [
      ['payments', '/admin/payments'],
      ['orders', '/admin/orders'],
      ['returns', '/admin/returns'],
      ['products', '/admin/products'],
      ['categories', '/admin/categories'],
      ['collections', '/admin/collections'],
      ['brands', '/admin/brands'],
      ['inventory', '/admin/inventory'],
      ['customers', '/admin/customers'],
      ['reviews', '/admin/reviews'],
      ['discounts', '/admin/discounts'],
      ['marketing', '/admin/marketing'],
      ['shipping', '/admin/shipping'],
      ['theme', '/admin/theme'],
      ['content', '/admin/content'],
      ['media', '/admin/media'],
      ['analytics', '/admin/analytics'],
      ['reports', '/admin/reports'],
      ['staff', '/admin/staff'],
      ['settings', '/admin/settings'],
      ['notifications', '/admin/notifications'],
      ['integrations', '/admin/integrations'],
      ['dashboard', '/admin'],
    ];

    for (const [mod, route] of priorityOrder) {
      if (permissions[mod] && permissions[mod].includes('view')) {
        return route;
      }
    }

    for (const [mod, actions] of Object.entries(permissions)) {
      if (Array.isArray(actions) && actions.includes('view')) {
        return `/admin/${mod}`;
      }
    }

    return '/admin';
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        customerProfiles: {
          where: { deletedAt: null },
          take: 1,
          select: {
            id: true,
            tenantId: true,
            district: true,
            avatar: true,
            ordersCount: true,
            totalSpent: true,
            storeCredit: true,
            segment: true,
          },
        },
        tenantMemberships: {
          select: {
            tenantId: true,
            isOwner: true,
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const profile = user.customerProfiles?.[0];
    const membership = user.tenantMemberships?.[0];
    const isOwner = Boolean(
      membership?.isOwner ||
      user.role === UserRole.OWNER ||
      String(user.role) === 'SUPER_ADMIN',
    );
    const isStaff = Boolean(membership && !isOwner);

    return ResponseHelper.success(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: isOwner ? 'OWNER' : isStaff ? 'STAFF' : user.role,
        isOwner,
        staffRole: isOwner
          ? 'Owner'
          : isStaff
            ? membership?.role?.name
            : undefined,
        permissions:
          (membership?.role?.permissions as Record<string, string[]>) ||
          (isOwner ? { all: ['*'] } : {}),
        district: profile?.district || null,
        avatar: profile?.avatar || null,
        ordersCount: profile?.ordersCount || 0,
        totalSpent: Number(profile?.totalSpent || 0),
        storeCredit: Number(profile?.storeCredit || 0),
        tenantId: membership?.tenantId || profile?.tenantId || null,
        store: membership?.tenant
          ? {
              id: membership.tenant.id,
              name: membership.tenant.name,
              slug: membership.tenant.slug,
            }
          : null,
      },
      'Profile fetched successfully',
    );
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone && existingPhone.id !== userId) {
        throw new ConflictException(
          'This phone number is already registered to another account',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name !== undefined ? dto.name : user.name,
        phone: dto.phone !== undefined ? dto.phone : user.phone,
      },
    });

    await this.prisma.customerProfile.updateMany({
      where: { userId: user.id, deletedAt: null },
      data: {
        name: updatedUser.name || 'Customer',
        phone: updatedUser.phone,
        ...(dto.district ? { district: dto.district } : {}),
        ...(dto.avatar ? { avatar: dto.avatar } : {}),
      },
    });

    return this.getProfile(userId);
  }
}
