import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateAboutPageDto } from './dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

export const DEFAULT_ABOUT_PAGE = {
  title: 'Our story',
  heading: 'Clothing that carries the hands that made it',
  heroImage:
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop',
  heroImageAlt: 'Two people in Tanti festive wear in a courtyard',
  storyParagraphs: [
    'Tanti means weaver. We started because the most beautiful textiles in the world were being made a few hours from Dhaka — and too few people could buy them without a middleman taking most of the value.',
    'Today we work directly with weavers, block-printers, cobblers and silversmiths across Bangladesh, paying fair, transparent rates and investing in the next generation of makers.',
  ],
  milestones: [
    {
      year: '2019',
      text: 'Started with 40 block-printed kurtas made with three families in Tangail.',
    },
    {
      year: '2021',
      text: 'Opened our flagship on Road 27, Dhanmondi, and launched Tanti Loom with Rupganj jamdani weavers.',
    },
    {
      year: '2023',
      text: 'Welcomed Pora — handmade leather from Bhairab — into the Tanti family.',
    },
    {
      year: '2026',
      text: '1,200+ artisans, delivery to all 64 districts and a new warehouse in Chattogram.',
    },
  ],
  stats: [
    { value: '1,200+', label: 'artisans we work with directly' },
    { value: '64', label: 'districts we deliver to' },
    { value: '38%', label: 'of every sale goes to makers' },
  ],
  ctaText: 'Read stories from our makers',
  ctaLink: '/journal',
  status: 'published',
  seoTitle: 'Our Story | Tanti',
  seoDescription:
    'Clothing that carries the hands that made it. Fair rates and craft empowerment across Bangladesh.',
};

@Injectable()
export class OwnerPageService {
  private readonly logger = new Logger(OwnerPageService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Get About Us page content for editing
  async getAboutPage(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const page = await this.prisma.cmsPage.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: 'about',
        },
      },
    });

    if (!page || !page.content) {
      return ResponseHelper.success(
        {
          ...DEFAULT_ABOUT_PAGE,
          id: page?.id || null,
          isDefault: !page,
          updatedAt: page?.updatedAt || new Date().toISOString(),
        },
        'Default About Us page retrieved successfully'
      );
    }

    try {
      const parsed = JSON.parse(page.content);
      return ResponseHelper.success(
        {
          ...DEFAULT_ABOUT_PAGE,
          ...parsed,
          title: page.title || parsed.title || DEFAULT_ABOUT_PAGE.title,
          status: page.status || parsed.status || 'published',
          id: page.id,
          isDefault: false,
          updatedAt: page.updatedAt,
        },
        'About Us page retrieved successfully'
      );
    } catch {
      return ResponseHelper.success(
        {
          ...DEFAULT_ABOUT_PAGE,
          id: page.id,
          rawContent: page.content,
          isDefault: false,
          updatedAt: page.updatedAt,
        },
        'About Us page retrieved successfully'
      );
    }
  }

  // 2. Update / Upsert About Us page content
  async updateAboutPage(dto: UpdateAboutPageDto, tenantId?: string, authorName?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    const title = dto.title?.trim() || DEFAULT_ABOUT_PAGE.title;
    const status = dto.status || 'published';
    const contentString = JSON.stringify(dto);

    const saved = await this.prisma.cmsPage.upsert({
      where: {
        tenantId_slug: {
          tenantId,
          slug: 'about',
        },
      },
      create: {
        tenantId,
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

    this.logger.log(`Upserted About Us page [${saved.id}] for tenant [${tenantId}]`);

    return ResponseHelper.success(
      {
        ...DEFAULT_ABOUT_PAGE,
        ...dto,
        id: saved.id,
        title: saved.title,
        status: saved.status,
        updatedAt: saved.updatedAt,
      },
      'About Us page saved successfully'
    );
  }

  // 3. Get all CMS pages list for Owner dashboard
  async getAllPages(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const pages = await this.prisma.cmsPage.findMany({
      where: { tenantId },
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

    // Ensure 'about' page appears in the list even if not yet saved in DB
    const hasAbout = pages.some((p) => p.slug === 'about' || p.slug === '/about');
    const allPages = hasAbout
      ? pages
      : [
          {
            id: 'default-about',
            title: DEFAULT_ABOUT_PAGE.title,
            slug: '/about',
            status: DEFAULT_ABOUT_PAGE.status,
            author: 'System Default',
            updatedAt: new Date(),
          },
          ...pages,
        ];

    return ResponseHelper.success(allPages, 'Pages retrieved successfully');
  }
}
