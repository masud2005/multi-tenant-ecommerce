import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';

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

    const socialsObj = (tenant.socials as Record<string, any>) || {};
    const defaultSocials = {
      facebook: socialsObj.facebook || 'https://facebook.com/tanti',
      instagram: socialsObj.instagram || 'https://instagram.com/tanti',
      twitter: socialsObj.twitter || 'https://twitter.com/tanti',
      youtube: socialsObj.youtube || '',
      tiktok: socialsObj.tiktok || '',
    };

    const publicData = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      tagline: tenant.tagline || 'Handloom & Contemporary Bangladeshi Fashion',
      logo: tenant.logo || '/images/tanti-logo.svg',
      favicon: tenant.favicon || '/favicon.ico',
      currency: tenant.currency || 'BDT',
      currencySymbol: tenant.currencySymbol || '৳',
      currencyPosition: tenant.currencyPosition || 'prefix',
      contact: defaultContact,
      socials: defaultSocials,
      announcement: tenant.announcement,
      announcementEnabled: tenant.announcementEnabled,
      theme: tenant.theme,
      modules: tenant.modules,
    };

    return ResponseHelper.success(
      publicData,
      'Public store information retrieved successfully',
    );
  }
}
