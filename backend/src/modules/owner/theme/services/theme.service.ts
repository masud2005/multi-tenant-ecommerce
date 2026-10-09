import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ResponseHelper } from '../../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../../common/exceptions/business.exception';
import { CreateThemeDto } from '../dto/create-theme.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { ReorderSectionsDto } from '../dto/reorder-sections.dto';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { PublishThemeDto } from '../dto/publish-theme.dto';
import { ThemeStatus, TenantStatus } from '../../../../../prisma/generated/client';
import {
  DEFAULT_THEME_TOKENS,
  DEFAULT_LANDING_SECTIONS,
} from '../constants/theme.constants';

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Validates that tenantId is present from current session
  private requireTenantId(tenantId: string): string {
    if (!tenantId) {
      throw new ConflictException('Tenant ID could not be resolved from the current session.');
    }
    return tenantId;
  }

  // Resolves tenantId for public storefront endpoint
  private async resolvePublicTenantId(tenantId?: string): Promise<string> {
    if (tenantId) return tenantId;
    const defaultTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null, status: TenantStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
    });
    if (!defaultTenant) {
      throw new ConflictException('No active tenant found.');
    }
    return defaultTenant.id;
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  // Ensures tenant always has a live theme with default section layout
  async ensureTenantLiveTheme(tenantId: string) {
    let liveTheme = await this.prisma.tenantTheme.findFirst({
      where: { tenantId, isLive: true },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        versions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!liveTheme) {
      liveTheme = await this.prisma.tenantTheme.create({
        data: {
          tenantId,
          name: 'Store Theme',
          status: ThemeStatus.PUBLISHED,
          isLive: true,
          primaryColor: DEFAULT_THEME_TOKENS.primaryColor,
          secondaryColor: DEFAULT_THEME_TOKENS.secondaryColor,
          accentColor: DEFAULT_THEME_TOKENS.accentColor,
          canvasColor: DEFAULT_THEME_TOKENS.canvasColor,
          surfaceColor: DEFAULT_THEME_TOKENS.surfaceColor,
          inkColor: DEFAULT_THEME_TOKENS.inkColor,
          fontHeading: DEFAULT_THEME_TOKENS.fontHeading,
          fontBody: DEFAULT_THEME_TOKENS.fontBody,
          borderRadius: DEFAULT_THEME_TOKENS.borderRadius,
          cardStyle: DEFAULT_THEME_TOKENS.cardStyle,
          publishedAt: new Date(),
          sections: {
            create: DEFAULT_LANDING_SECTIONS.map((sec, idx) => ({
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
        },
      });
    }

    return liveTheme;
  }

  // ─── Theme CRUD ──────────────────────────────────────────────────────────────

  // Returns live theme and all themes for owner tenant
  async findAll(tenantId: string) {
    const tid = this.requireTenantId(tenantId);
    const liveTheme = await this.ensureTenantLiveTheme(tid);

    const themes = await this.prisma.tenantTheme.findMany({
      where: { tenantId: tid },
      include: {
        _count: { select: { sections: true, versions: true } },
      },
      orderBy: [{ isLive: 'desc' }, { updatedAt: 'desc' }],
    });

    return ResponseHelper.success({ liveTheme, themes });
  }

  // Gets currently live theme for storefront without version history
  async getLiveTheme(tenantId?: string) {
    const tid = await this.resolvePublicTenantId(tenantId);

    // Ensure a live theme exists (creates default if none)
    await this.ensureTenantLiveTheme(tid);

    // Fetch only what the storefront needs — tokens + ordered sections, no versions
    const liveTheme = await this.prisma.tenantTheme.findFirst({
      where: { tenantId: tid, isLive: true },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        isLive: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        canvasColor: true,
        surfaceColor: true,
        inkColor: true,
        fontHeading: true,
        fontBody: true,
        borderRadius: true,
        cardStyle: true,
        customCss: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        sections: {
          where: { isVisible: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            sectionType: true,
            label: true,
            orderIndex: true,
            isVisible: true,
            settings: true,
          },
        },
      },
    });

    if (!liveTheme) {
      throw new NotFoundException('TenantTheme');
    }

    return ResponseHelper.success(liveTheme);
  }

  // Returns single theme by ID scoped to tenant
  async findOne(id: string, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId: tid },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
        versions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    return ResponseHelper.success(theme);
  }

  // Creates a new draft theme for tenant
  async create(dto: CreateThemeDto, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const createdTheme = await this.prisma.tenantTheme.create({
      data: {
        tenantId: tid,
        name: dto.name,
        status: ThemeStatus.DRAFT,
        isLive: false,
        primaryColor: dto.primaryColor || DEFAULT_THEME_TOKENS.primaryColor,
        secondaryColor: dto.secondaryColor || DEFAULT_THEME_TOKENS.secondaryColor,
        accentColor: dto.accentColor || DEFAULT_THEME_TOKENS.accentColor,
        canvasColor: dto.canvasColor || DEFAULT_THEME_TOKENS.canvasColor,
        surfaceColor: dto.surfaceColor || DEFAULT_THEME_TOKENS.surfaceColor,
        inkColor: dto.inkColor || DEFAULT_THEME_TOKENS.inkColor,
        fontHeading: dto.fontHeading || DEFAULT_THEME_TOKENS.fontHeading,
        fontBody: dto.fontBody || DEFAULT_THEME_TOKENS.fontBody,
        borderRadius: dto.borderRadius || DEFAULT_THEME_TOKENS.borderRadius,
        cardStyle: dto.cardStyle || DEFAULT_THEME_TOKENS.cardStyle,
        customCss: dto.customCss,
        sections: {
          create: DEFAULT_LANDING_SECTIONS.map((sec, idx) => ({
            sectionType: sec.sectionType,
            label: sec.label,
            orderIndex: idx,
            isVisible: sec.isVisible !== false,
          })),
        },
      },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
      },
    });

    return ResponseHelper.created(createdTheme, 'Theme created successfully');
  }

  // Saves draft changes to theme tokens and brand settings
  async update(id: string, dto: UpdateThemeDto, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId: tid },
    });
    if (!theme) {
      throw new NotFoundException('TenantTheme');
    }

    const updated = await this.prisma.tenantTheme.update({
      where: { id },
      data: { ...dto },
      include: {
        sections: { orderBy: { orderIndex: 'asc' } },
      },
    });

    return ResponseHelper.success(updated, 'Theme draft saved successfully');
  }

  // Publishes theme draft live and snapshots version
  async publish(id: string, dto: PublishThemeDto, tenantId: string, user?: any) {
    const tid = this.requireTenantId(tenantId);

    const targetTheme = await this.prisma.tenantTheme.findFirst({
      where: { id, tenantId: tid },
      include: { sections: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!targetTheme) {
      throw new NotFoundException('TenantTheme');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Demote any currently live themes for this tenant
      await tx.tenantTheme.updateMany({
        where: { tenantId: tid, isLive: true },
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
        },
      });

      // 3. Count past versions for numbering
      const versionCount = await tx.themeVersion.count({ where: { themeId: id } });
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
          publishedBy: user?.name || user?.email || 'Store Owner',
        },
      });

      // 5. Sync to Tenant.theme JSON column for backward compatibility
      await tx.tenant.update({
        where: { id: tid },
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

  // ─── Section Management ───────────────────────────────────────────────────────

  // Batch-reorders sections and toggles visibility
  async reorderSections(themeId: string, dto: ReorderSectionsDto, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id: themeId, tenantId: tid },
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

  // Adds a new section to theme
  async addSection(themeId: string, dto: CreateSectionDto, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const theme = await this.prisma.tenantTheme.findFirst({
      where: { id: themeId, tenantId: tid },
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

  // Updates a single theme section
  async updateSection(
    themeId: string,
    sectionId: string,
    dto: UpdateSectionDto,
    tenantId: string,
  ) {
    const tid = this.requireTenantId(tenantId);

    const section = await this.prisma.themeSection.findFirst({
      where: { id: sectionId, themeId, theme: { tenantId: tid } },
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

  // Removes a section from theme permanently
  async deleteSection(themeId: string, sectionId: string, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const section = await this.prisma.themeSection.findFirst({
      where: { id: sectionId, themeId, theme: { tenantId: tid } },
    });
    if (!section) {
      throw new NotFoundException('ThemeSection');
    }

    await this.prisma.themeSection.delete({ where: { id: sectionId } });
    return ResponseHelper.noContent('Section removed successfully');
  }

  // ─── Version History ──────────────────────────────────────────────────────────

  // Restores theme tokens and section layout from past version snapshot
  async restoreVersion(themeId: string, versionId: string, tenantId: string) {
    const tid = this.requireTenantId(tenantId);

    const version = await this.prisma.themeVersion.findFirst({
      where: { id: versionId, themeId, theme: { tenantId: tid } },
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
      await tx.tenantTheme.update({
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
      if (Array.isArray(snapshot.sections) && snapshot.sections.length > 0) {
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
}
