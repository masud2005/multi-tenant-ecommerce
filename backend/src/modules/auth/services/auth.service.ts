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

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly otpService: OtpService,
        private readonly eventEmitter: EventEmitter2,
        private readonly redisService: RedisService,
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
                tenantMemberships: true,
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

        const tenantId = user.tenantMemberships?.[0]?.tenantId;
        const payload = { sub: user.id, email: user.email, name: user.name || 'User', role: user.role, tenantId };
        const { accessToken, refreshToken } = generateTokens(
            this.jwtService,
            this.configService,
            payload,
        );

        // Store refresh token in Redis (e.g., valid for 30 days => 30 * 24 * 60 * 60)
        // Extract TTL from config or default to 30 days
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
                    role: user.role,
                    tenantId,
                },
            },
            'Login successful',
        );
    }

    async refreshToken(dto: RefreshTokenDto) {
        try {
            const refreshSecret = this.configService.get<string>('jwt.refreshSecret') as string;
            const decoded = this.jwtService.verify(dto.refreshToken, { secret: refreshSecret });

            // Check if token matches the one in Redis
            const storedToken = await this.redisService.get(`refresh_token:${decoded.sub}`);
            if (!storedToken || storedToken !== dto.refreshToken) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            // Verify user exists and is active
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.sub },
            });
            if (!user || user.status !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            // Generate a new token pair
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            const { accessToken, refreshToken } = generateTokens(
                this.jwtService,
                this.configService,
                payload,
            );

            // Update refresh token in Redis
            const refreshExpiresInStr = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') as string;
            const ttlSeconds = refreshExpiresInStr.includes('d') ? parseInt(refreshExpiresInStr) * 24 * 60 * 60 : 30 * 24 * 60 * 60;
            await this.redisService.set(`refresh_token:${user.id}`, refreshToken, ttlSeconds);

            return ResponseHelper.success(
                { accessToken, refreshToken },
                'Token refreshed successfully',
            );
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        await this.redisService.del(`refresh_token:${userId}`);

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

        // Determine destination redirect route based on staff permissions
        const permissions = (member.role?.permissions as Record<string, string[]>) || {};
        let redirectUrl = '/admin';
        if (permissions.orders && permissions.orders.includes('view')) {
            redirectUrl = '/admin/orders';
        } else if (permissions.products && permissions.products.includes('view')) {
            redirectUrl = '/admin/products';
        } else if (permissions.inventory && permissions.inventory.includes('view')) {
            redirectUrl = '/admin/inventory';
        } else if (permissions.customers && permissions.customers.includes('view')) {
            redirectUrl = '/admin/customers';
        }

        const payload = {
            sub: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name || 'Staff',
            role: updatedUser.role,
            tenantId: member.tenantId,
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
                    role: updatedUser.role,
                    tenantId: member.tenantId,
                    staffRole: member.role?.name,
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
}