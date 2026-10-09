import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { EmailService } from '../../../shared/mail/email-service';
import { staffInviteEmailTemplate } from '../../../shared/mail/templates/staff-invite-email.template';
import { UserRole, UserStatus } from '../../../../prisma/generated/client';
import {
  QueryStaffDto,
  InviteStaffDto,
  UpdateStaffDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Helper to resolve tenant context safely
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId) {
      const existing = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (existing) return existing.id;
    }

    const defaultTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (defaultTenant) {
      return defaultTenant.id;
    }

    // Auto-create default tenant if DB is freshly reset
    const createdTenant = await this.prisma.tenant.create({
      data: {
        name: 'Tanti Fashion',
        slug: 'tanti',
        currency: 'BDT',
        currencySymbol: '৳',
      },
    });

    return createdTenant.id;
  }

  // Auto-seed default standard roles for a tenant if none exist
  private async ensureDefaultRoles(tenantId: string) {
    const existingRolesCount = await this.prisma.tenantRole.count({
      where: { tenantId },
    });

    if (existingRolesCount > 0) return;

    const defaultRoles = [
      {
        name: 'Store Manager',
        description: 'Runs daily operations incl. orders, catalog, customers, and discounts.',
        isSystem: true,
        permissions: {
          dashboard: ['view'],
          orders: ['view', 'create', 'update', 'delete'],
          returns: ['view', 'create', 'update'],
          payments: ['view'],
          products: ['view', 'create', 'update', 'delete'],
          categories: ['view', 'create', 'update', 'delete'],
          collections: ['view', 'create', 'update', 'delete'],
          brands: ['view', 'create', 'update', 'delete'],
          inventory: ['view', 'create', 'update'],
          customers: ['view', 'create', 'update'],
          reviews: ['view', 'update', 'delete'],
          discounts: ['view', 'create', 'update', 'delete'],
          marketing: ['view', 'create', 'update'],
          shipping: ['view', 'update'],
          theme: ['view', 'update'],
          content: ['view', 'create', 'update', 'delete'],
          media: ['view', 'create', 'update', 'delete'],
          analytics: ['view'],
          reports: ['view'],
          notifications: ['view'],
          audit: ['view'],
        },
      },
      {
        name: 'Fulfillment Staff',
        description: 'Processes, packs, and ships orders; manages inventory stock.',
        isSystem: true,
        permissions: {
          dashboard: ['view'],
          orders: ['view', 'update'],
          returns: ['view', 'update'],
          inventory: ['view', 'update'],
          shipping: ['view', 'update'],
          customers: ['view'],
        },
      },
      {
        name: 'Customer Care',
        description: 'Views orders and customers, handles returns, inquiries, and reviews.',
        isSystem: true,
        permissions: {
          dashboard: ['view'],
          orders: ['view', 'update'],
          returns: ['view', 'update'],
          customers: ['view', 'update'],
          reviews: ['view', 'update', 'delete'],
        },
      },
      {
        name: 'Content Editor',
        description: 'Manages catalog items, pages, blogs, and media assets.',
        isSystem: true,
        permissions: {
          dashboard: ['view'],
          products: ['view', 'create', 'update'],
          categories: ['view', 'create', 'update'],
          collections: ['view', 'create', 'update'],
          brands: ['view', 'create', 'update'],
          theme: ['view', 'update'],
          content: ['view', 'create', 'update', 'delete'],
          media: ['view', 'create', 'update', 'delete'],
        },
      },
    ];

    for (const r of defaultRoles) {
      await this.prisma.tenantRole.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: r.name,
          },
        },
        update: {},
        create: {
          tenantId,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          permissions: r.permissions,
        },
      });
    }
  }

  // Fetch all staff members for the tenant with search, filtering, and role metadata
  async getStaffMembers(query: QueryStaffDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    // Make sure standard roles exist for tenant
    await this.ensureDefaultRoles(targetTenantId);

    const where: any = {
      tenantId: targetTenantId,
      deletedAt: null,
    };

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.status) {
      where.status = query.status.toLowerCase();
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.user = {
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s, mode: 'insensitive' } },
        ],
      };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const [members, total, activeCount, invitedCount, deactivatedCount, rolesCount] =
      await Promise.all([
        this.prisma.tenantMember.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                isSystem: true,
                permissions: true,
              },
            },
          },
          orderBy: [
            { isOwner: 'desc' },
            { createdAt: 'asc' },
          ],
          skip,
          take: limit,
        }),
        this.prisma.tenantMember.count({ where }),
        this.prisma.tenantMember.count({
          where: { tenantId: targetTenantId, status: 'active', deletedAt: null },
        }),
        this.prisma.tenantMember.count({
          where: { tenantId: targetTenantId, status: 'invited', deletedAt: null },
        }),
        this.prisma.tenantMember.count({
          where: { tenantId: targetTenantId, status: 'deactivated', deletedAt: null },
        }),
        this.prisma.tenantRole.count({
          where: { tenantId: targetTenantId },
        }),
      ]);

    const formattedMembers = members.map((m) => {
      const roleName = m.isOwner ? 'Owner' : m.role?.name || 'Staff';
      return {
        id: m.id,
        userId: m.userId,
        name: m.user?.name || m.user?.email?.split('@')[0] || 'Staff Member',
        email: m.user?.email || '',
        phone: m.user?.phone || '',
        role: roleName,
        roleId: m.roleId,
        roleDetails: m.role || null,
        isOwner: m.isOwner,
        status: m.status,
        twoFactor: m.twoFactor,
        lastActiveAt: m.lastActiveAt || m.user?.lastLoginAt || null,
        invitedAt: m.inviteExpiresAt ? m.createdAt : null,
        createdAt: m.createdAt,
      };
    });

    return ResponseHelper.success(
      {
        members: formattedMembers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts: {
          total,
          active: activeCount,
          invited: invitedCount,
          deactivated: deactivatedCount,
          rolesCount,
        },
      },
      'Staff members retrieved successfully',
    );
  }

  // 2. Invite or directly add a new staff member to the tenant with an assigned role
  async inviteStaff(dto: InviteStaffDto, tenantId?: string, adminUser?: any) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    await this.ensureDefaultRoles(targetTenantId);

    const email = dto.email.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email address is required');
    }

    // Resolve assigned TenantRole
    let targetRole: any = null;
    if (dto.roleId) {
      targetRole = await this.prisma.tenantRole.findFirst({
        where: { id: dto.roleId, tenantId: targetTenantId },
      });
    } else if (dto.roleName) {
      targetRole = await this.prisma.tenantRole.findFirst({
        where: {
          tenantId: targetTenantId,
          name: { equals: dto.roleName.trim(), mode: 'insensitive' },
        },
      });
    }

    if (!targetRole) {
      targetRole = await this.prisma.tenantRole.findFirst({
        where: { tenantId: targetTenantId, name: 'Store Manager' },
      });
    }

    if (!targetRole) {
      throw new NotFoundException('Selected role not found in this store');
    }

    // Check if user already exists in users table
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Check if already an active member of this tenant
      const existingMember = await this.prisma.tenantMember.findFirst({
        where: {
          tenantId: targetTenantId,
          userId: user.id,
          deletedAt: null,
        },
      });

      if (existingMember) {
        throw new BadRequestException(
          `User with email "${email}" is already a staff member in this store`,
        );
      }
    } else {
      // Create user account for staff member
      const rawPassword =
        dto.password?.trim() ||
        `Staff@${Math.floor(100000 + Math.random() * 900000)}`;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name?.trim() || email.split('@')[0],
          phone: dto.phone?.trim() || null,
          password: hashedPassword,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
      });
    }

    // Create TenantMember record with invited status
    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const member = await this.prisma.tenantMember.create({
      data: {
        tenantId: targetTenantId,
        userId: user.id,
        roleId: targetRole.id,
        isOwner: false,
        status: 'invited',
        inviteToken,
        inviteExpiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            isSystem: true,
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
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';
    const inviteLink = `${frontendUrl}/staff/accept-invite?token=${inviteToken}`;

    // Send invitation email
    try {
      await this.emailService.sendEmail(
        email,
        `Invitation to join ${member.tenant.name} as ${targetRole.name}`,
        staffInviteEmailTemplate(
          member.tenant.name,
          targetRole.name,
          inviteLink,
          member.user?.name || undefined,
        ),
      );
    } catch {
      // Ignore background mail transport exceptions
    }

    const formatted = {
      id: member.id,
      userId: member.userId,
      name: member.user?.name || email.split('@')[0],
      email: member.user?.email || email,
      phone: member.user?.phone || '',
      role: member.role?.name || 'Staff',
      roleId: member.roleId,
      roleDetails: member.role || null,
      isOwner: member.isOwner,
      status: member.status,
      twoFactor: member.twoFactor,
      lastActiveAt: member.lastActiveAt,
      invitedAt: member.createdAt,
      createdAt: member.createdAt,
    };

    return ResponseHelper.created(
      formatted,
      `Invitation sent successfully to "${formatted.email}" as "${formatted.role}"`,
    );
  }

  // Resend invitation email to a pending staff member
  async resendInvite(memberId: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const member = await this.prisma.tenantMember.findFirst({
      where: { id: memberId, tenantId: targetTenantId, deletedAt: null },
      include: { user: true, role: true, tenant: true },
    });

    if (!member || !member.user?.email) {
      throw new NotFoundException('Staff member not found');
    }

    if (member.status !== 'invited') {
      throw new BadRequestException('Can only resend invitation to pending invited members');
    }

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.tenantMember.update({
      where: { id: memberId },
      data: { inviteToken, inviteExpiresAt },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';
    const inviteLink = `${frontendUrl}/staff/accept-invite?token=${inviteToken}`;

    try {
      await this.emailService.sendEmail(
        member.user.email,
        `Invitation to join ${member.tenant.name} as ${member.role?.name || 'Staff'}`,
        staffInviteEmailTemplate(
          member.tenant.name,
          member.role?.name || 'Staff',
          inviteLink,
          member.user.name || undefined,
        ),
      );
    } catch {
      // Ignore transport errors
    }

    return ResponseHelper.success(
      null,
      `Invitation email resent successfully to ${member.user.email}`,
    );
  }

  // 3. Update staff member role, status (active/deactivated), or basic details
  async updateStaffMember(
    memberId: string,
    dto: UpdateStaffDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existingMember = await this.prisma.tenantMember.findFirst({
      where: {
        id: memberId,
        tenantId: targetTenantId,
        deletedAt: null,
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!existingMember) {
      throw new NotFoundException(`Staff member with ID "${memberId}" not found`);
    }

    if (existingMember.isOwner && dto.status === 'deactivated') {
      throw new BadRequestException('Store owner account cannot be deactivated');
    }

    // 1. Resolve role if roleId or roleName is provided
    let newRoleId = existingMember.roleId;
    if (dto.roleId) {
      const role = await this.prisma.tenantRole.findFirst({
        where: { id: dto.roleId, tenantId: targetTenantId },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID "${dto.roleId}" not found`);
      }
      newRoleId = role.id;
    } else if (dto.roleName) {
      const role = await this.prisma.tenantRole.findFirst({
        where: {
          tenantId: targetTenantId,
          name: { equals: dto.roleName.trim(), mode: 'insensitive' },
        },
      });
      if (!role) {
        throw new NotFoundException(`Role "${dto.roleName}" not found`);
      }
      newRoleId = role.id;
    }

    // 2. Update user name/phone if provided
    if (dto.name?.trim() || dto.phone?.trim()) {
      await this.prisma.user.update({
        where: { id: existingMember.userId },
        data: {
          name: dto.name?.trim() || existingMember.user.name,
          phone: dto.phone?.trim() || existingMember.user.phone,
        },
      });
    }

    // 3. Update TenantMember
    const updatedMember = await this.prisma.tenantMember.update({
      where: { id: memberId },
      data: {
        roleId: newRoleId,
        status: dto.status?.toLowerCase() || existingMember.status,
        twoFactor:
          dto.twoFactor !== undefined
            ? dto.twoFactor
            : existingMember.twoFactor,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            isSystem: true,
            permissions: true,
          },
        },
      },
    });

    const roleName = updatedMember.isOwner
      ? 'Owner'
      : updatedMember.role?.name || 'Staff';

    const formatted = {
      id: updatedMember.id,
      userId: updatedMember.userId,
      name:
        updatedMember.user?.name ||
        updatedMember.user?.email?.split('@')[0] ||
        'Staff Member',
      email: updatedMember.user?.email || '',
      phone: updatedMember.user?.phone || '',
      role: roleName,
      roleId: updatedMember.roleId,
      roleDetails: updatedMember.role || null,
      isOwner: updatedMember.isOwner,
      status: updatedMember.status,
      twoFactor: updatedMember.twoFactor,
      lastActiveAt:
        updatedMember.lastActiveAt || updatedMember.user?.lastLoginAt || null,
      invitedAt: updatedMember.inviteExpiresAt
        ? updatedMember.createdAt
        : null,
      createdAt: updatedMember.createdAt,
    };

    return ResponseHelper.success(
      formatted,
      `Staff member "${formatted.name}" updated successfully`,
    );
  }

  // 4. Remove a staff member from the store (soft delete)
  async removeStaffMember(
    memberId: string,
    tenantId?: string,
    adminUser?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existingMember = await this.prisma.tenantMember.findFirst({
      where: {
        id: memberId,
        tenantId: targetTenantId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingMember) {
      throw new NotFoundException(`Staff member with ID "${memberId}" not found`);
    }

    if (existingMember.isOwner) {
      throw new BadRequestException('Store owner account cannot be removed from store');
    }

    if (adminUser?.id && adminUser.id === existingMember.userId) {
      throw new BadRequestException('You cannot remove yourself from the store');
    }

    await this.prisma.tenantMember.update({
      where: { id: memberId },
      data: {
        deletedAt: new Date(),
        status: 'deactivated',
      },
    });

    const staffName =
      existingMember.user?.name ||
      existingMember.user?.email?.split('@')[0] ||
      'Staff member';

    return ResponseHelper.success(
      null,
      `Staff member "${staffName}" removed successfully from store`,
    );
  }

  // 5. Get all store roles and their granular permission matrices
  async getRoles(tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    await this.ensureDefaultRoles(targetTenantId);

    const roles = await this.prisma.tenantRole.findMany({
      where: { tenantId: targetTenantId },
      include: {
        _count: {
          select: {
            members: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      membersCount: r._count.members,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return ResponseHelper.success(
      formattedRoles,
      'Store roles and permission matrices retrieved successfully',
    );
  }

  // 6. Create a new custom role with permissions matrix
  async createRole(dto: CreateRoleDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const roleName = dto.name.trim();
    if (!roleName) {
      throw new BadRequestException('Role name is required');
    }

    const existingRole = await this.prisma.tenantRole.findFirst({
      where: {
        tenantId: targetTenantId,
        name: { equals: roleName, mode: 'insensitive' },
      },
    });

    if (existingRole) {
      throw new BadRequestException(`Role with name "${roleName}" already exists`);
    }

    const createdRole = await this.prisma.tenantRole.create({
      data: {
        tenantId: targetTenantId,
        name: roleName,
        description: dto.description?.trim() || null,
        isSystem: false,
        permissions: dto.permissions || {},
      },
    });

    return ResponseHelper.created(
      {
        ...createdRole,
        membersCount: 0,
      },
      `Custom role "${createdRole.name}" created successfully`,
    );
  }

  // 7. Update role metadata or permission matrix
  async updateRole(roleId: string, dto: UpdateRoleDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existingRole = await this.prisma.tenantRole.findFirst({
      where: { id: roleId, tenantId: targetTenantId },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    let updatedName = existingRole.name;
    if (dto.name && dto.name.trim() !== existingRole.name) {
      if (existingRole.isSystem) {
        throw new BadRequestException('System default role names cannot be renamed');
      }
      const duplicate = await this.prisma.tenantRole.findFirst({
        where: {
          tenantId: targetTenantId,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: roleId },
        },
      });
      if (duplicate) {
        throw new BadRequestException(`Another role named "${dto.name.trim()}" already exists`);
      }
      updatedName = dto.name.trim();
    }

    const updatedRole = await this.prisma.tenantRole.update({
      where: { id: roleId },
      data: {
        name: updatedName,
        description:
          dto.description !== undefined
            ? dto.description?.trim() || null
            : existingRole.description,
        permissions:
          dto.permissions !== undefined
            ? (dto.permissions as any)
            : (existingRole.permissions as any),
      },
    });

    const membersCount = await this.prisma.tenantMember.count({
      where: {
        tenantId: targetTenantId,
        roleId: roleId,
        deletedAt: null,
      },
    });

    return ResponseHelper.success(
      {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isSystem: updatedRole.isSystem,
        permissions: updatedRole.permissions,
        membersCount,
        createdAt: updatedRole.createdAt,
        updatedAt: updatedRole.updatedAt,
      },
      `Role "${updatedRole.name}" permissions updated successfully`,
    );
  }

  // 8. Delete a custom role
  async deleteRole(roleId: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existingRole = await this.prisma.tenantRole.findFirst({
      where: { id: roleId, tenantId: targetTenantId },
      include: {
        _count: {
          select: {
            members: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID "${roleId}" not found`);
    }

    if (existingRole.isSystem) {
      throw new BadRequestException('System default roles cannot be deleted');
    }

    if (existingRole._count.members > 0) {
      throw new BadRequestException(
        `Cannot delete role "${existingRole.name}" because it is currently assigned to ${existingRole._count.members} staff member(s). Reassign them first.`,
      );
    }

    await this.prisma.tenantRole.delete({
      where: { id: roleId },
    });

    return ResponseHelper.success(
      null,
      `Role "${existingRole.name}" deleted successfully`,
    );
  }
}
