import type { Tenant } from '@/types/tenant';

export const mockTenants: Record<string, Tenant> = {
  tanti: {
    id: 'tenant-tanti-01',
    slug: 'tanti',
    name: 'Tanti',
    tagline: 'Handloom & Contemporary Bangladeshi Fashion',
    domain: 'tanti.com.bd',
    customDomain: 'tanti.com.bd',
    logoUrl: '/images/tanti-logo.svg',
    plan: 'growth',
    planState: 'active',
    currency: {
      code: 'BDT',
      symbol: '৳',
      rate: 1,
      position: 'prefix'
    },
    theme: {
      primaryColor: '#8E2800',
      accentColor: '#D97706',
      fontSans: 'Inter',
      fontDisplay: 'Fraunces',
      borderRadius: '8px'
    },
    modules: {
      ecommerce: true,
      pos: true,
      inventory: true,
      analytics: true,
      marketing: true,
      customDomain: true
    },
    contact: {
      email: 'care@tanti.com.bd',
      phone: '09612-826842',
      whatsapp: '+880 1700-000000',
      address: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
      workingHours: 'Sat–Thu, 10 AM – 9 PM',
      responseTime: 'Replies within 2 to 4 working hours',
      supportTeam: 'Tanti Care team',
    },
    socials: {
      facebook: 'https://facebook.com/tanti',
      instagram: 'https://instagram.com/tanti',
      twitter: 'https://twitter.com/tanti',
    }
  },
  'orvio-demo': {
    id: 'tenant-orvio-02',
    slug: 'orvio-demo',
    name: 'Orvio Gadgets',
    tagline: 'Modern Tech & Lifestyle Accessories',
    domain: 'gadgets.orvio.com',
    plan: 'enterprise',
    planState: 'active',
    currency: {
      code: 'USD',
      symbol: '$',
      rate: 1,
      position: 'prefix'
    },
    theme: {
      primaryColor: '#2563EB',
      accentColor: '#10B981',
      fontSans: 'Inter',
      fontDisplay: 'Inter',
      borderRadius: '12px'
    },
    modules: {
      ecommerce: true,
      pos: false,
      inventory: true,
      analytics: true,
      marketing: false,
      customDomain: false
    },
    contact: {
      email: 'hello@orvio.com',
      phone: '+1 800-555-0199',
      address: '742 Evergreen Terrace, Springfield, USA'
    }
  }
};

export const DEFAULT_TENANT_SLUG = 'tanti';

export function getTenantBySlug(slug?: string | null): Tenant {
  if (!slug) return mockTenants[DEFAULT_TENANT_SLUG];
  return mockTenants[slug.toLowerCase()] || mockTenants[DEFAULT_TENANT_SLUG];
}

export function getTenantByHostname(hostname?: string | null): Tenant {
  if (!hostname) return mockTenants[DEFAULT_TENANT_SLUG];
  const cleaned = hostname.split(':')[0].toLowerCase();
  
  // Direct match on custom domain or domain
  for (const tenant of Object.values(mockTenants)) {
    if (tenant.domain.toLowerCase() === cleaned || tenant.customDomain?.toLowerCase() === cleaned) {
      return tenant;
    }
  }

  // Subdomain match (e.g., tanti.localhost or tanti.orvio.com)
  const parts = cleaned.split('.');
  if (parts.length > 1) {
    const sub = parts[0];
    if (mockTenants[sub]) {
      return mockTenants[sub];
    }
  }

  return mockTenants[DEFAULT_TENANT_SLUG];
}
