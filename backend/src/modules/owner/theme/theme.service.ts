import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { PublishThemeDto } from './dto/publish-theme.dto';
import { ThemeStatus } from '../../../../prisma/generated/client';

export const DEFAULT_PRESETS = [
  {
    name: 'Minimalist Craft',
    slug: 'minimalist-craft',
    description: 'Earthy organic tones, editorial serif typography, and warm tactile accents.',
    previewImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    defaultTokens: {
      primaryColor: '#B5562F',
      secondaryColor: '#2E3A67',
      accentColor: '#5C6B4E',
      canvasColor: '#F7F4EF',
      surfaceColor: '#FFFFFF',
      inkColor: '#1C1A17',
      fontHeading: 'Fraunces',
      fontBody: 'Inter',
      borderRadius: '0.5rem',
      cardStyle: 'portrait-hover',
    },
    defaultSections: [
      { sectionType: 'HERO_BANNER', label: 'Hero Banner', isVisible: true },
      { sectionType: 'CATEGORY_GRID', label: 'Shop by Category', isVisible: true },
      { sectionType: 'BESTSELLERS', label: 'Bestseller Products', isVisible: true },
      { sectionType: 'SUMMER_SPOTLIGHT', label: 'Spotlight Banner', isVisible: true },
      { sectionType: 'NEW_ARRIVALS', label: 'New Arrivals', isVisible: true },
      { sectionType: 'TRUST_POINTS', label: 'Brand Trust Points', isVisible: true },
      { sectionType: 'TESTIMONIALS', label: 'Customer Reviews', isVisible: true },
      { sectionType: 'RECOMMENDED', label: 'Recommended For You', isVisible: true },
    ],
  },
  {
    name: 'Modern Luxe',
    slug: 'modern-luxe',
    description: 'Sophisticated midnight navy, gold accents, and sharp luxurious borders.',
    previewImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
    defaultTokens: {
      primaryColor: '#1E293B',
      secondaryColor: '#C5A880',
      accentColor: '#D97706',
      canvasColor: '#F8FAFC',
      surfaceColor: '#FFFFFF',
      inkColor: '#0F172A',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: '0.25rem',
      cardStyle: 'portrait-minimal',
    },
    defaultSections: [
      { sectionType: 'HERO_BANNER', label: 'Hero Banner', isVisible: true },
      { sectionType: 'CATEGORY_GRID', label: 'Collections Grid', isVisible: true },
      { sectionType: 'BESTSELLERS', label: 'Curated Picks', isVisible: true },
      { sectionType: 'SUMMER_SPOTLIGHT', label: 'Exclusive Spotlight', isVisible: true },
      { sectionType: 'NEW_ARRIVALS', label: 'New Season', isVisible: true },
      { sectionType: 'TESTIMONIALS', label: 'Client Voices', isVisible: true },
      { sectionType: 'RECOMMENDED', label: 'Recommended', isVisible: true },
    ],
  },
  {
    name: 'Urban Streetwear',
    slug: 'urban-streetwear',
    description: 'High contrast brutalist design with bold dark accents and rounded pill geometry.',
    previewImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    defaultTokens: {
      primaryColor: '#0F172A',
      secondaryColor: '#EA580C',
      accentColor: '#10B981',
      canvasColor: '#F1F5F9',
      surfaceColor: '#FFFFFF',
      inkColor: '#020617',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      borderRadius: '0.75rem',
      cardStyle: 'square-badge',
    },
    defaultSections: [
      { sectionType: 'HERO_BANNER', label: 'Hero Drop Banner', isVisible: true },
      { sectionType: 'NEW_ARRIVALS', label: 'Latest Drops', isVisible: true },
      { sectionType: 'CATEGORY_GRID', label: 'Departments', isVisible: true },
      { sectionType: 'BESTSELLERS', label: 'Hype Items', isVisible: true },
      { sectionType: 'TRUST_POINTS', label: 'Express Shipping & Guarantee', isVisible: true },
    ],
  },
];

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Seed or retrieve base presets
  async ensurePresets() {
    for (const preset of DEFAULT_PRESETS) {
      await this.prisma.themePreset.upsert({
        where: { slug: preset.slug },
        update: {
          name: preset.name,
          description: preset.description,
          defaultTokens: preset.defaultTokens,
          defaultSections: preset.defaultSections,
        },
        create: preset,
      });
    }
    return this.prisma.themePreset.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 2. Ensure tenant has at least one active live theme
  async ensureTenantLiveTheme(tenantId: string) {
    let liveTheme = await this.prisma.tenantTheme.findFirst({
      where: { tenantId, isLive: true },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        versions: { orderBy: { createdAt: 'desc' }, take: 5 },
        preset: true,
      },
    });

    if (!liveTheme) {
      await this.ensurePresets();
      const defaultPreset = await this.prisma.themePreset.findFirst({
        where: { slug: 'minimalist-craft' },
      });

      const tokens = (defaultPreset?.defaultTokens as any) || DEFAULT_PRESETS[0].defaultTokens;
      const sectionsConfig = (defaultPreset?.defaultSections as any[]) || DEFAULT_PRESETS[0].defaultSections;

      liveTheme = await this.prisma.tenantTheme.create({
        data: {
          tenantId,
          presetId: defaultPreset?.id,
          name: 'Default Live Theme',
          status: ThemeStatus.PUBLISHED,
          isLive: true,
          primaryColor: tokens.primaryColor,
          secondaryColor: tokens.secondaryColor,
          accentColor: tokens.accentColor,
          canvasColor: tokens.canvasColor,
          surfaceColor: tokens.surfaceColor,
          inkColor: tokens.inkColor,
          fontHeading: tokens.fontHeading,
          fontBody: tokens.fontBody,
          borderRadius: tokens.borderRadius,
          cardStyle: tokens.cardStyle,
          publishedAt: new Date(),
          sections: {
            create: sectionsConfig.map((sec, idx) => ({
              sectionType: sec.sectionType,
              label: sec.label,
              orderIndex: idx,
              isVisible: sec.isVisible !== false,
            })),
          },
        },
        include: {
          sections: { orderBy: { orderIndex: 'asc' } },
          versions: true,
          preset: true,
        },
      });
    }

    return liveTheme;
  }

  // 3. Find all themes for owner tenant
  async findAll(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated session.');
    }

    const presets = await this.ensurePresets();
    await this.ensureTenantLiveTheme(tenantId);

    const themes = await this.prisma.tenantTheme.findMany({
      where: { tenantId },
      include: {
        preset: true,
        _count: { select: { sections: true, versions: true } },
      },
      orderBy: [{ isLive: 'desc' }, { updatedAt: 'desc' }],
    });

    const liveTheme = await this.prisma.tenantTheme.findFirst({
      where: { tenantId, isLive: true },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        versions: { orderBy: { createdAt: 'desc' }, take: 10 },
        preset: true,
      },
    });

    return ResponseHelper.success({
      themes,
      liveTheme,
      presets,
    });
  }

  // 4. Find single theme details
  async findOne(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        versions: { orderBy: { createdAt: 'desc' }, take: 20 },
        preset: true,
      },
    });

    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    return ResponseHelper.success(theme);
  }

  // 5. Get current live theme for storefront or preview
  async getLiveTheme(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const liveTheme = await this.ensureTenantLiveTheme(tenantId);
    return ResponseHelper.success(liveTheme);
  }

  // 6. Create / Clone Theme
  async create(dto: CreateThemeDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    let defaultTokens: any = {};
    let defaultSections: any[] = [];

    if (dto.presetId) {
      const preset = await this.prisma.themePreset.findUnique({
        where: { id: dto.presetId },
      });
      if (preset) {
        defaultTokens = (preset.defaultTokens as any) || {};
        defaultSections = (preset.defaultSections as any[]) || [];
      }
    }

    const createdTheme = await this.prisma.tenantTheme.create({
      data: {
        tenantId,
        presetId: dto.presetId,
        name: dto.name,
        status: ThemeStatus.DRAFT,
        isLive: false,
        primaryColor: dto.primaryColor || defaultTokens.primaryColor || '#B5562F',
        secondaryColor: dto.secondaryColor || defaultTokens.secondaryColor || '#2E3A67',
        accentColor: dto.accentColor || defaultTokens.accentColor || '#5C6B4E',
        canvasColor: dto.canvasColor || defaultTokens.canvasColor || '#F7F4EF',
        surfaceColor: dto.surfaceColor || defaultTokens.surfaceColor || '#FFFFFF',
        inkColor: dto.inkColor || defaultTokens.inkColor || '#1C1A17',
        fontHeading: dto.fontHeading || defaultTokens.fontHeading || 'Fraunces',
        fontBody: dto.fontBody || defaultTokens.fontBody || 'Inter',
        borderRadius: dto.borderRadius || defaultTokens.borderRadius || '0.5rem',
        cardStyle: dto.cardStyle || defaultTokens.cardStyle || 'portrait-hover',
        customCss: dto.customCss,
        sections: {
          create: defaultSections.map((sec, idx) => ({
            sectionType: sec.sectionType,
            label: sec.label,
            orderIndex: idx,
            isVisible: sec.isVisible !== false,
          })),
        },
      },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        preset: true,
      },
    });

    return ResponseHelper.created(createdTheme, 'Theme created successfully');
  }

  // 7. Update Theme Tokens & Settings (Draft Save)
  async update(id: string, dto: UpdateThemeDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId },
    });
    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    const updated = await this.prisma.tenantTheme.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        preset: true,
      },
    });

    return ResponseHelper.success(updated, 'Theme draft saved successfully');
  }

  // 8. Publish Theme
  async publish(id: string, dto: PublishThemeDto, tenantId?: string, user?: any) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const targetTheme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId },
      include: { sections: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!targetTheme) {
      throw new NotFoundException('TenantTheme');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Demote any currently live themes for this tenant
      await tx.tenantTheme.updateMany({
        where: { tenantId, isLive: true },
        data: { isLive: false },
      });

      // 2. Mark this theme as live & published
      const published = await tx.tenantTheme.update({
        where: { id },
        data: {
          isLive: true,
          status: ThemeStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: {
          sections: { orderBy: { orderIndex: 'asc' } },
          preset: true,
        },
      });

      // 3. Count past versions for numbering
      const versionCount = await tx.themeVersion.count({
        where: { themeId: id },
      });

      const nextVersionTag = `v1.${versionCount + 1}`;
      const snapshotData = {
        tokens: {
          primaryColor: published.primaryColor,
          secondaryColor: published.secondaryColor,
          accentColor: published.accentColor,
          canvasColor: published.canvasColor,
          surfaceColor: published.surfaceColor,
          inkColor: published.inkColor,
          fontHeading: published.fontHeading,
          fontBody: published.fontBody,
          borderRadius: published.borderRadius,
          cardStyle: published.cardStyle,
          customCss: published.customCss,
        },
        sections: published.sections,
      };

      // 4. Create snapshot version record
      await tx.themeVersion.create({
        data: {
          themeId: id,
          version: nextVersionTag,
          label: dto?.label || `Published by ${user?.name || user?.email || 'Store Owner'}`,
          snapshot: snapshotData,
          publishedBy: user?.name || user?.email || 'Owner',
        },
      });

      // 5. Update Tenant.theme JSON column for sync backward compatibility
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          theme: {
            primaryColor: published.primaryColor,
            accentColor: published.accentColor,
            fontSans: published.fontBody,
            fontDisplay: published.fontHeading,
            borderRadius: published.borderRadius,
          },
        },
      });

      return ResponseHelper.success(published, 'Theme published live to storefront');
    });
  }

  // 9. Duplicate Theme
  async duplicate(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const source = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId },
      include: { sections: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!source) {
      throw new NotFoundException('Source Theme');
    }

    const cloned = await this.prisma.tenantTheme.create({
      data: {
        tenantId,
        presetId: source.presetId,
        name: `${source.name} (Copy)`,
        status: ThemeStatus.DRAFT,
        isLive: false,
        primaryColor: source.primaryColor,
        secondaryColor: source.secondaryColor,
        accentColor: source.accentColor,
        canvasColor: source.canvasColor,
        surfaceColor: source.surfaceColor,
        inkColor: source.inkColor,
        fontHeading: source.fontHeading,
        fontBody: source.fontBody,
        borderRadius: source.borderRadius,
        cardStyle: source.cardStyle,
        customCss: source.customCss,
        sections: {
          create: source.sections.map((sec) => ({
            sectionType: sec.sectionType,
            label: sec.label,
            orderIndex: sec.orderIndex,
            isVisible: sec.isVisible,
            settings: sec.settings as any,
          })),
        },
      },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        preset: true,
      },
    });

    return ResponseHelper.created(cloned, 'Theme duplicated successfully');
  }

  // 10. Reorder Sections in Batch
  async reorderSections(themeId: string, dto: ReorderSectionsDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id: themeId, tenantId },
    });
    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    await this.prisma.$transaction(
      dto.sections.map((item) =>
        this.prisma.themeSection.updateMany({
          where: { id: item.id, themeId },
          data: {
            orderIndex: item.orderIndex,
            ...(item.isVisible !== undefined ? { isVisible: item.isVisible } : {}),
          },
        })
      )
    );

    const updatedSections = await this.prisma.themeSection.findMany({
      where: { themeId },
      orderBy: { orderIndex: 'asc' },
    });

    return ResponseHelper.success(updatedSections, 'Sections reordered successfully');
  }

  // 11. Add Section
  async addSection(themeId: string, dto: CreateSectionDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id: themeId, tenantId },
    });
    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    const count = await this.prisma.themeSection.count({ where: { themeId } });
    const section = await this.prisma.themeSection.create({
      data: {
        themeId,
        sectionType: dto.sectionType,
        label: dto.label,
        orderIndex: dto.orderIndex ?? count,
        isVisible: dto.isVisible ?? true,
        settings: dto.settings,
      },
    });

    return ResponseHelper.created(section, 'Section added to theme');
  }

  // 12. Update Section
  async updateSection(themeId: string, sectionId: string, dto: UpdateSectionDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const section = await this.prisma.themeSection.findFirst({
      where: { id: sectionId, themeId, theme: { tenantId } },
    });
    if (!section) {
      throw new NotFoundException('ThemeSection');
    }

    const updated = await this.prisma.themeSection.update({
      where: { id: sectionId },
      data: dto,
    });

    return ResponseHelper.success(updated, 'Section updated successfully');
  }

  // 13. Delete Section
  async deleteSection(themeId: string, sectionId: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const section = await this.prisma.themeSection.findFirst({
      where: { id: sectionId, themeId, theme: { tenantId } },
    });
    if (!section) {
      throw new NotFoundException('ThemeSection');
    }

    await this.prisma.themeSection.delete({ where: { id: sectionId } });
    return ResponseHelper.noContent('Section removed successfully');
  }

  // 14. Restore from snapshot version
  async restoreVersion(themeId: string, versionId: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const version = await this.prisma.themeVersion.findFirst({
      where: { id: versionId, themeId, theme: { tenantId } },
    });
    if (!version) {
      throw new NotFoundException('ThemeVersion');
    }

    const snapshot = version.snapshot as any;
    if (!snapshot || !snapshot.tokens) {
      throw new BadRequestException('Corrupted or invalid snapshot data');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Restore tokens
      const updated = await tx.tenantTheme.update({
        where: { id: themeId },
        data: {
          primaryColor: snapshot.tokens.primaryColor,
          secondaryColor: snapshot.tokens.secondaryColor,
          accentColor: snapshot.tokens.accentColor,
          canvasColor: snapshot.tokens.canvasColor,
          surfaceColor: snapshot.tokens.surfaceColor,
          inkColor: snapshot.tokens.inkColor,
          fontHeading: snapshot.tokens.fontHeading,
          fontBody: snapshot.tokens.fontBody,
          borderRadius: snapshot.tokens.borderRadius,
          cardStyle: snapshot.tokens.cardStyle,
          customCss: snapshot.tokens.customCss,
        },
      });

      // 2. Restore sections if present in snapshot
      if (Array.isArray(snapshot.sections)) {
        await tx.themeSection.deleteMany({ where: { themeId } });
        await tx.themeSection.createMany({
          data: snapshot.sections.map((s: any, idx: number) => ({
            themeId,
            sectionType: s.sectionType,
            label: s.label,
            orderIndex: s.orderIndex ?? idx,
            isVisible: s.isVisible !== false,
            settings: s.settings,
          })),
        });
      }

      const freshTheme = await tx.tenantTheme.findUnique({
        where: { id: themeId },
        include: {
          sections: { orderBy: { orderIndex: 'asc' } },
          versions: { orderBy: { createdAt: 'desc' } },
        },
      });

      return ResponseHelper.success(freshTheme, `Rolled back to ${version.version}`);
    });
  }

  // 15. Delete Theme
  async delete(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant not resolved.');
    }

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId },
    });
    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    if (theme.isLive) {
      throw new ConflictException('Cannot delete the currently live theme. Activate another theme first.');
    }

    await this.prisma.tenantTheme.delete({ where: { id } });
    return ResponseHelper.noContent('Theme deleted successfully');
  }
}
