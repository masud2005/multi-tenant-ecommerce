import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
    UserRole,
    UserStatus,
    OtpType,
} from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { OtpService } from './otp.service';
import {
    ConflictException,
    InvalidCredentialsException,

    UnauthorizedException,
} from '../../../common/exceptions/business.exception';

import { ConfigService } from '@nestjs/config';
import { generateTokens } from '../utils/token.util';
import { RedisService } from '../../../shared/redis/redis.service';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly otpService: OtpService,
        private readonly eventEmitter: EventEmitter2,
        private readonly redisService: RedisService,
        private readonly notificationService: NotificationService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const saltRounds = this.configService.get<number>('app.bcryptSaltRounds') as number;
        const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                phone: dto.phone,
                email: dto.email,
                password: hashedPassword,
                role: UserRole.CUSTOMER,
                status: UserStatus.PENDING_VERIFICATION
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
                role: user.role
            },
            'Registration successful. Please check your email for the verification code.',
        );
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                tenantMemberships: {
                    include: {
                        role: true,
                        tenant: true,
                    },
                },
            },
        });
        if (!user || !user.password) {
            throw new InvalidCredentialsException();
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new InvalidCredentialsException();
        }

        if (user.status === UserStatus.PENDING_VERIFICATION) {
            await this.otpService.sendOtp({
                email: user.email!,
                type: OtpType.ACCOUNT_VERIFY,
            });
            throw new UnauthorizedException(
                'Your account is not verified yet. We have sent a new OTP to your email. Please verify your account to continue.',
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

        const membership = user.tenantMemberships?.[0];
        const tenantId = membership?.tenantId;
        const isOwner = Boolean(membership?.isOwner || user.role === UserRole.OWNER || (user.role as any) === 'SUPER_ADMIN');
        const staffRole = membership?.role?.name || (isOwner ? 'Owner' : 'Staff');
        const permissions = (membership?.role?.permissions as Record<string, string[]>) || {};
        const effectiveRole = isOwner ? 'OWNER' : (membership ? 'STAFF' : user.role);

        // Calculate dynamic landing route for staff based on all modules
        const redirectUrl = isOwner ? '/admin' : this.resolveFirstAllowedRoute(permissions);

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
        const { accessToken, refreshToken } = generateTokens(
            this.jwtService,
            this.configService,
            payload,
        );

        // Store refresh token in Redis (e.g., valid for 30 days => 30 * 24 * 60 * 60)
        const refreshExpiresInStr = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') as string;
        const ttlSeconds = refreshExpiresInStr.includes('d') ? parseInt(refreshExpiresInStr) * 24 * 60 * 60 : 30 * 24 * 60 * 60;
        await this.redisService.set(`refresh_token:${user.id}`, refreshToken, ttlSeconds);

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
            const refreshSecret = this.configService.get<string>('jwt.refreshSecret') as string;
            const decoded = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });

            // Check if token matches the current or grace-window previous token in Redis
            const storedToken = await this.redisService.get(`refresh_token:${decoded.sub}`);
            const prevToken = await this.redisService.get(`refresh_token_prev:${decoded.sub}`);
            if (!storedToken || (storedToken !== dto.refreshToken && prevToken !== dto.refreshToken)) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            // Verify user exists and is active, including tenant memberships
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.sub },
                include: {
                    tenantMemberships: true,
                },
            });
            if (!user || user.status !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            const tenantId = user.tenantMemberships?.[0]?.tenantId;

            // Generate a new token pair preserving all claims
            const payload = {
                sub: user.id,
                email: user.email,
                name: user.name || 'User',
                role: user.role,
                tenantId,
            };
            const { accessToken, refreshToken } = generateTokens(
                this.jwtService,
                this.configService,
                payload,
            );

            // Update refresh token in Redis with rotation & 15s grace window for previous token
            const refreshExpiresInStr = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') as string;
            const ttlSeconds = refreshExpiresInStr?.includes('d') ? parseInt(refreshExpiresInStr) * 24 * 60 * 60 : 30 * 24 * 60 * 60;
            await this.redisService.set(`refresh_token_prev:${user.id}`, dto.refreshToken, 15);
            await this.redisService.set(`refresh_token:${user.id}`, refreshToken, ttlSeconds);

            return ResponseHelper.success(
                {
                    accessToken,
                    refreshToken,
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
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        await this.redisService.del(`refresh_token:${userId}`);
        await this.redisService.del(`refresh_token_prev:${userId}`);

        // Invalidate current access tokens by storing a logout timestamp (TTL: 15 mins)
        await this.redisService.set(`user_logout:${userId}`, Date.now().toString(), 15 * 60);

        this.eventEmitter.emit('activity.log', {
            type: 'USER_LOGOUT',
            message: `User logged out`,
            metadata: { userId },
        });

        return ResponseHelper.success(null, 'Logged out successfully');
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
            throw new UnauthorizedException('This invitation has expired. Please ask the store owner for a new invite.');
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
    async acceptStaffInvite(dto: { token: string; password: string; name?: string }) {
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
            throw new UnauthorizedException('This invitation has expired. Please ask the store owner for a new invite.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user record
        const updatedUser = await this.prisma.user.update({
            where: { id: member.userId },
            data: {
                password: hashedPassword,
                name: name?.trim() || member.user.name,
                status: UserStatus.ACTIVE,
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

        const permissions = (member.role?.permissions as Record<string, string[]>) || {};
        const isOwner = Boolean(member.isOwner);
        const staffRole = member.role?.name || (isOwner ? 'Owner' : 'Staff');
        const effectiveRole = isOwner ? 'OWNER' : 'STAFF';
        const redirectUrl = isOwner ? '/admin' : this.resolveFirstAllowedRoute(permissions);

        // Notify store owner that a staff member has accepted invite and joined (In-App)
        (async () => {
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
            } catch (err) {
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

        const { accessToken, refreshToken } = generateTokens(
            this.jwtService,
            this.configService,
            payload,
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
    private resolveFirstAllowedRoute(permissions: Record<string, string[]>): string {
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
}