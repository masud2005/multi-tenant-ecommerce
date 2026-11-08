import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateAboutPageDto, UpdatePolicyPageDto, UpdateReturnsPageDto } from './dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

export const POLICY_SLUGS = [
  'returns',
  'shipping',
  'privacy',
  'terms',
  'cookies',
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

const POLICY_TITLES: Record<PolicySlug, string> = {
  returns: 'Return Policy',
  shipping: 'Shipping Policy',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  cookies: 'Cookie Policy',
};

const EMPTY_ABOUT = {
  title: '',
  heading: '',
  heroImage: '',
  heroImageAlt: '',
  storyParagraphs: [] as string[],
  milestones: [] as { year: string; text: string }[],
  stats: [] as { value: string; label: string }[],
  ctaText: '',
  ctaLink: '',
  status: 'draft' as const,
  seoTitle: '',
  seoDescription: '',
};

const EMPTY_POLICY = {
  title: '',
  heading: '',
  sections: [] as { heading: string; body: string }[],
  status: 'draft' as const,
};

function isPolicySlug(slug: string): slug is PolicySlug {
  return (POLICY_SLUGS as readonly string[]).includes(slug);
}

@Injectable()
export class OwnerPageService {
  private readonly logger = new Logger(OwnerPageService.name);

  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException(
        'Tenant could not be resolved from authenticated user.',
      );
    }
    return tenantId;
  }

  // ─── About ───────────────────────────────────────────────

  async getAboutPage(tenantId?: string) {
    const tid = this.requireTenant(tenantId);

    const page = await this.prisma.cmsPage.findUnique({
      where: { tenantId_slug: { tenantId: tid, slug: 'about' } },
    });

    if (!page || !page.content) {
      return ResponseHelper.success(
        {
          ...EMPTY_ABOUT,
          id: page?.id || null,
          isEmpty: true,
          updatedAt: page?.updatedAt || null,
        },
        'About page is empty',
      );
    }

    try {
      const parsed = JSON.parse(page.content);
      const storyParagraphs = Array.isArray(parsed.storyParagraphs)
        ? parsed.storyParagraphs.filter((p: string) => String(p || '').trim())
        : [];
      const isEmpty =
        !String(parsed.heading || page.title || '').trim() &&
        storyParagraphs.length === 0;

      return ResponseHelper.success(
        {
          ...EMPTY_ABOUT,
          ...parsed,
          title: page.title || parsed.title || '',
          status: page.status || parsed.status || 'draft',
          id: page.id,
          isEmpty,
          updatedAt: page.updatedAt,
        },
        'About Us page retrieved successfully',
      );
    } catch {
      return ResponseHelper.success(
        {
          ...EMPTY_ABOUT,
          id: page.id,
          title: page.title || '',
          status: page.status || 'draft',
          rawContent: page.content,
          isEmpty: !page.title,
          updatedAt: page.updatedAt,
        },
        'About Us page retrieved successfully',
      );
    }
  }

  async updateAboutPage(
    dto: UpdateAboutPageDto,
    tenantId?: string,
    authorName?: string,
  ) {
    const tid = this.requireTenant(tenantId);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tid } });
    if (!tenant) throw new NotFoundException('Tenant');

    const title = dto.title?.trim() || 'About';
    const status = dto.status || 'draft';
    const contentString = JSON.stringify(dto);

    const saved = await this.prisma.cmsPage.upsert({
      where: { tenantId_slug: { tenantId: tid, slug: 'about' } },
      create: {
        tenantId: tid,
        title,
        slug: 'about',
        status,
        author: authorName || 'Store Admin',
        content: contentString,
      },
      update: {
        title,
        status,
        author: authorName || 'Store Admin',
        content: contentString,
      },
    });

    this.logger.log(`Upserted About page [${saved.id}] for tenant [${tid}]`);

    return ResponseHelper.success(
      {
        ...dto,
        id: saved.id,
        title: saved.title,
        status: saved.status,
        updatedAt: saved.updatedAt,
        isEmpty: false,
      },
      'About Us page saved successfully',
    );
  }

  // ─── Policies (returns, shipping, privacy, terms, cookies) ─

  async getPolicyPage(slug: string, tenantId?: string) {
    const tid = this.requireTenant(tenantId);
    const clean = (slug || '').replace(/^\//, '').trim().toLowerCase();
    if (!isPolicySlug(clean)) {
      throw new BadRequestException(
        `Unsupported policy slug. Allowed: ${POLICY_SLUGS.join(', ')}`,
      );
    }

    const page = await this.prisma.cmsPage.findUnique({
      where: { tenantId_slug: { tenantId: tid, slug: clean } },
    });

    if (!page || !page.content) {
      return ResponseHelper.success(
        {
          ...EMPTY_POLICY,
          title: POLICY_TITLES[clean],
          slug: clean,
          id: page?.id || null,
          isEmpty: true,
          updatedAt: page?.updatedAt || null,
        },
        'Policy page is empty',
      );
    }

    try {
      const parsed = JSON.parse(page.content);
      const sections = Array.isArray(parsed.sections)
        ? parsed.sections.filter(
            (s: any) =>
              String(s?.heading || '').trim() || String(s?.body || '').trim(),
          )
        : [];
      const isEmpty =
        sections.length === 0 &&
        !String(parsed.heading || '').trim() &&
        !String(page.title || parsed.title || '').trim();

      return ResponseHelper.success(
        {
          ...EMPTY_POLICY,
          ...parsed,
          title: page.title || parsed.title || POLICY_TITLES[clean],
          status: page.status || parsed.status || 'draft',
          slug: clean,
          id: page.id,
          isEmpty,
          updatedAt: page.updatedAt,
          sections,
        },
        'Policy page retrieved successfully',
      );
    } catch {
      return ResponseHelper.success(
        {
          ...EMPTY_POLICY,
          title: page.title || POLICY_TITLES[clean],
          slug: clean,
          id: page.id,
          status: page.status || 'draft',
          isEmpty: true,
          updatedAt: page.updatedAt,
        },
        'Policy page retrieved successfully',
      );
    }
  }

  async updatePolicyPage(
    slug: string,
    dto: UpdatePolicyPageDto | UpdateReturnsPageDto,
    tenantId?: string,
    authorName?: string,
  ) {
    const tid = this.requireTenant(tenantId);
    const clean = (slug || '').replace(/^\//, '').trim().toLowerCase();
    if (!isPolicySlug(clean)) {
      throw new BadRequestException(
        `Unsupported policy slug. Allowed: ${POLICY_SLUGS.join(', ')}`,
      );
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tid } });
    if (!tenant) throw new NotFoundException('Tenant');

    const title = dto.title?.trim() || POLICY_TITLES[clean];
    const status = dto.status || 'draft';
    const contentString = JSON.stringify(dto);

    const saved = await this.prisma.cmsPage.upsert({
      where: { tenantId_slug: { tenantId: tid, slug: clean } },
      create: {
        tenantId: tid,
        title,
        slug: clean,
        status,
        author: authorName || 'Store Admin',
        content: contentString,
      },
      update: {
        title,
        status,
        author: authorName || 'Store Admin',
        content: contentString,
      },
    });

    this.logger.log(
      `Upserted policy [${clean}] page [${saved.id}] for tenant [${tid}]`,
    );

    return ResponseHelper.success(
      {
        ...dto,
        id: saved.id,
        title: saved.title,
        status: saved.status,
        slug: clean,
        updatedAt: saved.updatedAt,
        isEmpty: false,
      },
      'Policy page saved successfully',
    );
  }

  /** @deprecated Prefer getPolicyPage('returns') */
  async getReturnsPage(tenantId?: string) {
    return this.getPolicyPage('returns', tenantId);
  }

  /** @deprecated Prefer updatePolicyPage('returns', dto) */
  async updateReturnsPage(
    dto: UpdateReturnsPageDto,
    tenantId?: string,
    authorName?: string,
  ) {
    return this.updatePolicyPage('returns', dto, tenantId, authorName);
  }

  async getAllPages(tenantId?: string) {
    const tid = this.requireTenant(tenantId);
    const pages = await this.prisma.cmsPage.findMany({
      where: { tenantId: tid },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        author: true,
        updatedAt: true,
      },
    });
    return ResponseHelper.success(pages, 'Pages retrieved successfully');
  }
}
