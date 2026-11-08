import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { mergeStoreShippingDefaults } from '../../../common/constants/shipping.constant';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Fetch public store identity, branding, and contact details
  async getPublicStoreInfo(tenantIdOrSlug?: string) {
    let tenant = null;

    if (tenantIdOrSlug && tenantIdOrSlug.trim().length > 0) {
      const identifier = tenantIdOrSlug.trim();
      tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: identifier }, { slug: identifier }, { domain: identifier }, { customDomain: identifier }],
          deletedAt: null,
        },
      });
    }

    if (!tenant) {
      tenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!tenant) {
      throw new NotFoundException('Store information not found');
    }

    // No mock contact/social fallbacks — empty if admin has not configured them
    const contactObj = (tenant.contact as Record<string, any>) || {};
    const publicContact = {
      email: contactObj.email || '',
      phone: contactObj.phone || '',
      whatsapp: contactObj.whatsapp || '',
      address: contactObj.address || '',
      workingHours: contactObj.workingHours || '',
      responseTime: contactObj.responseTime || '',
      supportTeam: contactObj.supportTeam || '',
    };

    const socialsObj = (tenant.socials as Record<string, any>) || {};
    const publicSocials = {
      facebook: socialsObj.facebook || '',
      instagram: socialsObj.instagram || '',
      twitter: socialsObj.twitter || '',
      youtube: socialsObj.youtube || '',
      tiktok: socialsObj.tiktok || '',
    };

    const existingSettings = (tenant.settings as Record<string, any>) || {};
    const settings = {
      ...existingSettings,
      shipping: mergeStoreShippingDefaults(
        (existingSettings.shipping as Record<string, any>) || {},
      ),
    };

    const publicData = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      tagline: tenant.tagline || null,
      logo: tenant.logo || null,
      favicon: tenant.favicon || null,
      currency: tenant.currency || 'BDT',
      currencySymbol: tenant.currencySymbol || '৳',
      currencyPosition: tenant.currencyPosition || 'prefix',
      contact: publicContact,
      socials: publicSocials,
      announcement: tenant.announcement,
      announcementEnabled: tenant.announcementEnabled,
      theme: tenant.theme,
      modules: tenant.modules,
      settings,
    };

    return ResponseHelper.success(
      publicData,
      'Public store information retrieved successfully',
    );
  }
}
