import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { NotFoundException } from '../../../common/exceptions/business.exception';

@Injectable()
export class CustomerFaqService {
  constructor(private readonly prisma: PrismaService) {}

  async getFaqs(tenantId?: string, category?: string) {
    let resolvedTenantId = tenantId;

    if (!resolvedTenantId) {
      const firstTenant = await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      if (!firstTenant) {
        throw new NotFoundException('Store tenant');
      }
      resolvedTenantId = firstTenant.id;
    }

    const where: any = { tenantId: resolvedTenantId };
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const items = await this.prisma.faqItem.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return ResponseHelper.success(items, 'Store FAQs retrieved successfully');
  }
}
