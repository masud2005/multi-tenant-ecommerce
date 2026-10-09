import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateStoreSettingsDto } from './dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  // 1. Get complete store settings and public contact details
  async getStoreSettings(tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: {
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
      },
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
    if (dto.logo !== undefined) updateData.logo = dto.logo;
    if (dto.favicon !== undefined) updateData.favicon = dto.favicon;
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

    // Merge Settings JSON safely
    if (dto.settings !== undefined) {
      const existingSettings = (existing.settings as Record<string, any>) || {};
      updateData.settings = {
        ...existingSettings,
        ...dto.settings,
      };
    }

    const updated = await this.prisma.tenant.update({
      where: { id: targetTenantId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
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
      },
    });

    this.logger.log(`Store settings updated for tenant: ${updated.name} (${updated.slug})`);

    return ResponseHelper.success(
      updated,
      'Store settings updated successfully',
    );
  }
}
