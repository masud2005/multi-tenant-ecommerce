import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { UpdateStoreSettingsDto } from './dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

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

    // Default contact fallback if not yet configured in DB
    const contactObj = (tenant.contact as Record<string, any>) || {};
    const defaultContact = {
      email: contactObj.email || 'care@tanti.com.bd',
      phone: contactObj.phone || '09612-826842',
      whatsapp: contactObj.whatsapp || '+880 1700-000000',
      address:
        contactObj.address ||
        'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
      workingHours: contactObj.workingHours || 'Sat–Thu, 10 AM – 9 PM',
      responseTime:
        contactObj.responseTime || 'Replies within 2 to 4 working hours',
      supportTeam: contactObj.supportTeam || `${tenant.name} Care team`,
    };

    // Default socials fallback
    const socialsObj = (tenant.socials as Record<string, any>) || {};
    const defaultSocials = {
      facebook: socialsObj.facebook || 'https://facebook.com/tanti',
      instagram: socialsObj.instagram || 'https://instagram.com/tanti',
      twitter: socialsObj.twitter || 'https://twitter.com/tanti',
      youtube: socialsObj.youtube || '',
      tiktok: socialsObj.tiktok || '',
    };

    const formattedData = {
      ...tenant,
      contact: defaultContact,
      socials: defaultSocials,
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

    const updateData: any = {};

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
      const existingContact = (existing.contact as Record<string, any>) || {};
      updateData.contact = {
        ...existingContact,
        ...dto.contact,
      };
    }

    // Merge Socials JSON safely
    if (dto.socials !== undefined) {
      const existingSocials = (existing.socials as Record<string, any>) || {};
      updateData.socials = {
        ...existingSocials,
        ...dto.socials,
      };
    }

    // Merge Settings JSON safely (deep-merge nested payment/shipping so toggles never get wiped)
    if (dto.settings !== undefined) {
      const existingSettings = (existing.settings as Record<string, any>) || {};
      const incoming = dto.settings as Record<string, any>;
      updateData.settings = {
        ...existingSettings,
        ...incoming,
        payment: {
          ...((existingSettings.payment as Record<string, any>) || {}),
          ...((incoming.payment as Record<string, any>) || {}),
        },
        shipping: {
          ...((existingSettings.shipping as Record<string, any>) || {}),
          ...((incoming.shipping as Record<string, any>) || {}),
        },
        pm: {
          ...((existingSettings.pm as Record<string, any>) || {}),
          ...((incoming.pm as Record<string, any>) || {}),
        },
        flags: {
          ...((existingSettings.flags as Record<string, any>) || {}),
          ...((incoming.flags as Record<string, any>) || {}),
        },
      };
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

      return ResponseHelper.success(updated, 'Store logo uploaded successfully');
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
