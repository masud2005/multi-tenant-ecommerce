import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { NotFoundException } from '../../../common/exceptions/business.exception';
import { DEFAULT_ABOUT_PAGE, DEFAULT_RETURNS_PAGE } from '../../owner/page/page.service';

@Injectable()
export class CustomerPageService {
  constructor(private readonly prisma: PrismaService) {}

  // Resolve active store tenant
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId) return tenantId;

    const firstTenant = await this.prisma.tenant.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    if (!firstTenant) {
      throw new NotFoundException('Store tenant');
    }
    return firstTenant.id;
  }

  // Get public page by slug (e.g. 'about')
  async getPageBySlug(slug: string, headerTenantId?: string) {
    const tenantId = await this.resolveTenantId(headerTenantId);
    const cleanSlug = (slug || '').replace(/^\//, '').trim().toLowerCase();

    const page = await this.prisma.cmsPage.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: cleanSlug,
        },
      },
    });

    // If published page exists in database
    if (page && page.status === 'published' && page.content) {
      try {
        const parsed = JSON.parse(page.content);
        return ResponseHelper.success(
          {
            ...parsed,
            id: page.id,
            title: page.title || parsed.title,
            slug: page.slug,
            updatedAt: page.updatedAt,
          },
          'Page content retrieved successfully'
        );
      } catch {
        return ResponseHelper.success(
          {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page.id,
            updatedAt: page.updatedAt,
          },
          'Page content retrieved successfully'
        );
      }
    }

    // Default fallback for About Us page
    if (cleanSlug === 'about' || cleanSlug === 'about-us') {
      return ResponseHelper.success(
        {
          ...DEFAULT_ABOUT_PAGE,
          id: page?.id || null,
          slug: 'about',
          updatedAt: page?.updatedAt || new Date().toISOString(),
        },
        'About Us page retrieved successfully'
      );
    }

    // Default fallback for Returns & Refund policy page
    if (cleanSlug === 'returns' || cleanSlug === 'policies/returns') {
      return ResponseHelper.success(
        {
          ...DEFAULT_RETURNS_PAGE,
          id: page?.id || null,
          slug: 'returns',
          updatedAt: page?.updatedAt || new Date().toISOString(),
        },
        'Returns policy page retrieved successfully'
      );
    }

    throw new NotFoundException(`Page '${slug}'`);
  }
}
