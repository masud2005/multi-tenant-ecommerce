import { Prisma } from '../../../../prisma/generated/client';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId && tenantId.length > 10) {
      const exists = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (exists) return exists.id;
    }

    const defaultTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!defaultTenant) {
      throw new NotFoundException('Store tenant context not found');
    }

    return defaultTenant.id;
  }

  // Automatically record platform events emitted via EventEmitter
  @OnEvent('activity.log')
  async handleActivityLog(payload: {
    tenantId?: string;
    actor?: string;
    type?: string;
    action?: string;
    message?: string;
    category?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    try {
      let tid = payload.tenantId;
      if (!tid) {
        const def = await this.prisma.tenant.findFirst({
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
        tid = def?.id;
      }
      if (!tid) return;

      await this.prisma.auditLog.create({
        data: {
          tenantId: tid,
          actor: payload.actor || 'System',
          action: payload.action || payload.type || 'ACTIVITY',
          resource: payload.message || 'General System Activity',
          category: payload.category || 'Security',
          after: payload.metadata ? JSON.stringify(payload.metadata) : null,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(`Could not persist audit log: ${message}`);
    }
  }

  // Create an explicit audit log entry
  async record(
    tenantId: string,
    actor: string,
    action: string,
    resource: string,
    category: string,
    before?: Prisma.InputJsonValue,
    after?: Prisma.InputJsonValue,
  ) {
    const tid = await this.resolveTenantId(tenantId);
    return this.prisma.auditLog.create({
      data: {
        tenantId: tid,
        actor,
        action,
        resource,
        category,
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
      },
    });
  }

  // Retrieve paginated audit logs for the store with filtering
  async getAuditLogs(query: QueryAuditLogDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const where: Prisma.AuditLogWhereInput = {
      tenantId: targetTenantId,
    };

    if (query.category && query.category !== 'All') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.actor && query.actor !== 'All') {
      where.actor = { contains: query.actor, mode: 'insensitive' };
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { action: { contains: s, mode: 'insensitive' } },
        { resource: { contains: s, mode: 'insensitive' } },
        { actor: { contains: s, mode: 'insensitive' } },
      ];
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [logs, total, categories, actors] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where: { tenantId: targetTenantId },
        distinct: ['category'],
        select: { category: true },
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId: targetTenantId },
        distinct: ['actor'],
        select: { actor: true },
      }),
    ]);

    return ResponseHelper.success(
      {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          categories: categories.map((c) => c.category),
          actors: actors.map((a) => a.actor),
        },
      },
      'Audit logs retrieved successfully',
    );
  }
}
