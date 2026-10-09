import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LogSearchDto } from './dto/log-search.dto';
import { LogClickDto } from './dto/log-click.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(authHeader?: string): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    try {
      const token = authHeader.replace('Bearer ', '').trim();
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const role = (payload.role || '').toUpperCase();
        return ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'].includes(role);
      }
    } catch {
      // ignore
    }
    return false;
  }

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

  async logSearch(dto: LogSearchDto, tenantId?: string, authHeader?: string) {
    if (this.isAdmin(authHeader)) {
      return ResponseHelper.success(null, 'Admin search excluded from customer analytics');
    }

    const targetTenantId = await this.resolveTenantId(tenantId);
    const cleanTerm = dto.term ? dto.term.trim().toLowerCase() : '';

    if (!cleanTerm || cleanTerm.length < 2) {
      return ResponseHelper.success(null, 'Ignored short term');
    }

    const resultsCount = typeof dto.results === 'number' ? dto.results : 0;
    const now = new Date();

    try {
      await this.prisma.$executeRaw`
        INSERT INTO search_query_logs ("id", "tenantId", "term", "count", "results", "clicks", "lastSearchedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${targetTenantId}, ${cleanTerm}, 1, ${resultsCount}, 0, ${now}, ${now}, ${now})
        ON CONFLICT ("tenantId", "term")
        DO UPDATE SET
          "count" = search_query_logs."count" + 1,
          "results" = ${resultsCount},
          "lastSearchedAt" = ${now},
          "updatedAt" = ${now}
      `;

      return ResponseHelper.success({ term: cleanTerm, results: resultsCount }, 'Search query recorded');
    } catch (err: any) {
      this.logger.error('Failed to log search query:', err);
      return ResponseHelper.success(null, 'Search query logging failed gracefully');
    }
  }

  async logClick(dto: LogClickDto, tenantId?: string, authHeader?: string) {
    if (this.isAdmin(authHeader)) {
      return ResponseHelper.success(null, 'Admin click excluded from customer analytics');
    }

    const targetTenantId = await this.resolveTenantId(tenantId);
    const cleanTerm = dto.term ? dto.term.trim().toLowerCase() : '';

    if (!cleanTerm || cleanTerm.length < 2) {
      return ResponseHelper.success(null, 'Ignored short term');
    }

    const now = new Date();

    try {
      await this.prisma.$executeRaw`
        INSERT INTO search_query_logs ("id", "tenantId", "term", "count", "results", "clicks", "lastSearchedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${targetTenantId}, ${cleanTerm}, 1, 0, 1, ${now}, ${now}, ${now})
        ON CONFLICT ("tenantId", "term")
        DO UPDATE SET
          "clicks" = search_query_logs."clicks" + 1,
          "lastSearchedAt" = ${now},
          "updatedAt" = ${now}
      `;

      return ResponseHelper.success({ term: cleanTerm }, 'Product click recorded');
    } catch (err: any) {
      this.logger.error('Failed to log product click:', err);
      return ResponseHelper.success(null, 'Product click logging failed gracefully');
    }
  }
}

