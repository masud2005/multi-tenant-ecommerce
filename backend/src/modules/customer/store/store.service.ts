import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { mergeStoreShippingDefaults } from '../../../common/constants/shipping.constant';

function jsonText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

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
          OR: [
            { id: identifier },
            { slug: identifier },
            { domain: identifier },
            { customDomain: identifier },
          ],
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
    const contactObj = (tenant.contact as Record<string, unknown>) || {};
    const publicContact = {
      email: jsonText(contactObj.email),
      phone: jsonText(contactObj.phone),
      whatsapp: jsonText(contactObj.whatsapp),
      address: jsonText(contactObj.address),
      workingHours: jsonText(contactObj.workingHours),
      responseTime: jsonText(contactObj.responseTime),
      supportTeam: jsonText(contactObj.supportTeam),
    };

    const socialsObj = (tenant.socials as Record<string, unknown>) || {};
    const publicSocials = {
      facebook: jsonText(socialsObj.facebook),
      instagram: jsonText(socialsObj.instagram),
      twitter: jsonText(socialsObj.twitter),
      youtube: jsonText(socialsObj.youtube),
      tiktok: jsonText(socialsObj.tiktok),
    };

    const existingSettings = (tenant.settings as Record<string, unknown>) || {};
    const settings = {
      ...existingSettings,
      shipping: mergeStoreShippingDefaults(
        (existingSettings.shipping as Record<string, unknown>) || {},
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
