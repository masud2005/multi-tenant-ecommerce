import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { NotFoundException } from '../../../common/exceptions/business.exception';
import { POLICY_SLUGS } from '../../owner/page/page.service';

@Injectable()
export class CustomerPageService {
  constructor(private readonly prisma: PrismaService) {}

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

  private isPublishedContent(page: {
    status: string;
    content: string | null;
  }): boolean {
    return page.status === 'published' && Boolean(page.content?.trim());
  }

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

    if (!page || !this.isPublishedContent(page)) {
      throw new NotFoundException(`Page '${slug}'`);
    }

    try {
      const parsed = JSON.parse(page.content as string);

      // About: require heading or story
      if (cleanSlug === 'about') {
        const paragraphs = Array.isArray(parsed.storyParagraphs)
          ? parsed.storyParagraphs.filter((p: string) => String(p || '').trim())
          : [];
        if (!String(parsed.heading || '').trim() && paragraphs.length === 0) {
          throw new NotFoundException(`Page '${slug}'`);
        }
      }

      // Policies: require at least one section or heading
      if ((POLICY_SLUGS as readonly string[]).includes(cleanSlug)) {
        const sections = Array.isArray(parsed.sections)
          ? parsed.sections.filter(
              (s: any) =>
                String(s?.heading || '').trim() || String(s?.body || '').trim(),
            )
          : [];
        if (sections.length === 0 && !String(parsed.heading || '').trim()) {
          throw new NotFoundException(`Page '${slug}'`);
        }
        parsed.sections = sections;
      }

      return ResponseHelper.success(
        {
          ...parsed,
          id: page.id,
          title: page.title || parsed.title,
          slug: page.slug,
          status: page.status,
          updatedAt: page.updatedAt,
        },
        'Page content retrieved successfully',
      );
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException(`Page '${slug}'`);
    }
  }
}
