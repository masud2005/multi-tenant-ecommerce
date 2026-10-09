export type TenantPlan = 'starter' | 'growth' | 'enterprise';

export type TenantPlanState = 'active' | 'trial' | 'past_due' | 'suspended';

export interface TenantCurrency {
  code: string;
  symbol: string;
  rate: number; // conversion rate against USD/base
  position: 'prefix' | 'suffix';
}

export interface TenantTheme {
  primaryColor: string;
  accentColor: string;
  fontSans: string;
  fontDisplay: string;
  borderRadius: string;
}

export interface TenantModules {
  ecommerce: boolean;
  pos: boolean;
  inventory: boolean;
  analytics: boolean;
  marketing: boolean;
  customDomain: boolean;
}

export interface TenantContact {
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  workingHours?: string;
  responseTime?: string;
  supportTeam?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  domain: string;
  customDomain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  plan: TenantPlan;
  planState: TenantPlanState;
  currency: TenantCurrency;
  theme: TenantTheme;
  modules: TenantModules;
  contact: TenantContact;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
}
