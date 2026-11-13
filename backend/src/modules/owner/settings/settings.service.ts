import { Prisma } from '../../../../prisma/generated/client';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { UpdateStoreSettingsDto } from './dto';
import { toInputJson } from '../../../common/helpers/json.helper';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  DEFAULT_STORE_SHIPPING,
  mergeStoreShippingDefaults,
} from '../../../common/constants/shipping.constant';

function jsonText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Helper to resolve the active tenant ID
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

  private readonly settingsSelect = {
    id: true,
    name: true,
    slug: true,
    tagline: true,
    domain: true,
    customDomain: true,
    logo: true,
    favicon: true,
    status: true,
    plan: true,
    planState: true,
    currency: true,
    currencySymbol: true,
    currencyPosition: true,
    contact: true,
    socials: true,
    settings: true,
    announcement: true,
    announcementEnabled: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  // 1. Get complete store settings and public contact details
  async getStoreSettings(tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: this.settingsSelect,
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    // No mock contact/social fallbacks — empty if not configured
    const contactObj = (tenant.contact as Record<string, unknown>) || {};
    const defaultContact = {
      email: jsonText(contactObj.email),
      phone: jsonText(contactObj.phone),
      whatsapp: jsonText(contactObj.whatsapp),
      address: jsonText(contactObj.address),
      workingHours: jsonText(contactObj.workingHours),
      responseTime: jsonText(contactObj.responseTime),
      supportTeam: jsonText(contactObj.supportTeam),
    };

    const socialsObj = (tenant.socials as Record<string, unknown>) || {};
    const defaultSocials = {
      facebook: jsonText(socialsObj.facebook),
      instagram: jsonText(socialsObj.instagram),
      twitter: jsonText(socialsObj.twitter),
      youtube: jsonText(socialsObj.youtube),
      tiktok: jsonText(socialsObj.tiktok),
    };

    // Ensure shipping defaults exist in DB (Inside Dhaka ৳70 / Outside ৳150)
    const existingSettings = (tenant.settings as Record<string, unknown>) || {};
    const existingShipping =
      (existingSettings.shipping as Record<string, unknown>) || {};
    const shipping = mergeStoreShippingDefaults(existingShipping);
    const shippingIncomplete =
      typeof existingShipping.insideDhaka !== 'number' ||
      typeof existingShipping.outsideDhaka !== 'number';

    const settings = {
      ...existingSettings,
      shipping,
    };

    if (shippingIncomplete) {
      try {
        await this.prisma.tenant.update({
          where: { id: targetTenantId },
          data: { settings },
        });
      } catch (err) {
        this.logger.warn(
          `Could not persist default shipping for tenant ${targetTenantId}: ${String(err)}`,
        );
      }
    }

    const formattedData = {
      ...tenant,
      contact: defaultContact,
      socials: defaultSocials,
      settings,
    };

    return ResponseHelper.success(
      formattedData,
      'Store settings retrieved successfully',
    );
  }

  // 2. Update store configuration, branding, and contact info
  async updateStoreSettings(dto: UpdateStoreSettingsDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
    });

    if (!existing) {
      throw new NotFoundException('Store not found');
    }

    const updateData: Prisma.TenantUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.tagline !== undefined) updateData.tagline = dto.tagline.trim();
    if (dto.logo !== undefined) {
      updateData.logo = dto.logo.trim() ? dto.logo.trim() : null;
    }
    if (dto.favicon !== undefined) {
      updateData.favicon = dto.favicon.trim() ? dto.favicon.trim() : null;
    }
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.currencySymbol !== undefined)
      updateData.currencySymbol = dto.currencySymbol;
    if (dto.currencyPosition !== undefined)
      updateData.currencyPosition = dto.currencyPosition;
    if (dto.announcement !== undefined)
      updateData.announcement = dto.announcement;
    if (dto.announcementEnabled !== undefined)
      updateData.announcementEnabled = dto.announcementEnabled;

    // Merge Contact JSON safely
    if (dto.contact !== undefined) {
      const existingContact =
        (existing.contact as Record<string, unknown>) || {};
      updateData.contact = toInputJson({
        ...existingContact,
        ...dto.contact,
      });
    }

    // Merge Socials JSON safely
    if (dto.socials !== undefined) {
      const existingSocials =
        (existing.socials as Record<string, unknown>) || {};
      updateData.socials = toInputJson({
        ...existingSocials,
        ...dto.socials,
      });
    }

    // Merge Settings JSON safely (deep-merge nested payment/shipping so toggles never get wiped)
    if (dto.settings !== undefined) {
      const existingSettings =
        (existing.settings as Record<string, unknown>) || {};
      const incoming = dto.settings;
      updateData.settings = toInputJson({
        ...existingSettings,
        ...incoming,
        payment: {
          ...((existingSettings.payment as Record<string, unknown>) || {}),
          ...((incoming.payment as Record<string, unknown>) || {}),
        },
        shipping: (() => {
          const mergedShipping: Record<string, unknown> = {
            ...DEFAULT_STORE_SHIPPING,
            ...((existingSettings.shipping as Record<string, unknown>) || {}),
            ...((incoming.shipping as Record<string, unknown>) || {}),
          };
          // Drop retired mock/RTO toggles — restock is always automatic on return RECEIVED
          delete mergedShipping.rto;
          delete mergedShipping.autoRestock;
          delete mergedShipping.restockOnReturn;
          delete mergedShipping.couriers;
          delete mergedShipping.logisticsOverview;
          return mergeStoreShippingDefaults(mergedShipping);
        })(),
        pm: {
          ...((existingSettings.pm as Record<string, unknown>) || {}),
          ...((incoming.pm as Record<string, unknown>) || {}),
        },
        flags: {
          ...((existingSettings.flags as Record<string, unknown>) || {}),
          ...((incoming.flags as Record<string, unknown>) || {}),
        },
        authPage: {
          ...((existingSettings.authPage as Record<string, unknown>) || {}),
          ...((incoming.authPage as Record<string, unknown>) || {}),
        },
      });
    }

    const updated = await this.prisma.tenant.update({
      where: { id: targetTenantId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: this.settingsSelect,
    });

    this.logger.log(
      `Store settings updated for tenant: ${updated.name} (${updated.slug})`,
    );

    return ResponseHelper.success(
      updated,
      'Store settings updated successfully',
    );
  }

  // 3. Upload / replace store logo
  async uploadLogo(file: Express.Multer.File, tenantId?: string) {
    if (!file) {
      throw new BadRequestException('Logo image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Logo must be an image file');
    }

    const targetTenantId = await this.resolveTenantId(tenantId);
    const existing = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: { id: true, logo: true, name: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException('Store not found');
    }

    const uploadResult = await this.storageService.uploadFile(file, {
      folder: 'store/logos',
      publicId: `tenant-${existing.id}-logo`,
      overwrite: true,
      tags: ['store-logo', existing.slug],
    });

    try {
      const updated = await this.prisma.tenant.update({
        where: { id: targetTenantId },
        data: {
          logo: uploadResult.url,
          updatedAt: new Date(),
        },
        select: this.settingsSelect,
      });

      // Best-effort cleanup if previous logo was a different Cloudinary asset
      if (
        existing.logo &&
        existing.logo !== uploadResult.url &&
        !existing.logo.includes(`tenant-${existing.id}-logo`)
      ) {
        this.storageService.deleteFile(existing.logo).catch(() => {});
      }

      this.logger.log(
        `Store logo uploaded for tenant: ${updated.name} (${updated.slug})`,
      );

      return ResponseHelper.success(
        updated,
        'Store logo uploaded successfully',
      );
    } catch (error) {
      await this.storageService.deleteFile(uploadResult.url).catch(() => {});
      throw error;
    }
  }

  // 4. Remove store logo
  async removeLogo(tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const existing = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: { id: true, logo: true, name: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException('Store not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: targetTenantId },
      data: {
        logo: null,
        updatedAt: new Date(),
      },
      select: this.settingsSelect,
    });

    if (existing.logo) {
      this.storageService.deleteFile(existing.logo).catch(() => {});
    }

    this.logger.log(
      `Store logo removed for tenant: ${updated.name} (${updated.slug})`,
    );

    return ResponseHelper.success(updated, 'Store logo removed successfully');
  }
}
