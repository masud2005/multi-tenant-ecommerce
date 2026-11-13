'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Tenant, TenantModules } from '@/types/tenant';
import { getTenantBySlug, mockTenants, DEFAULT_TENANT_SLUG } from '@/data/tenants';
import { storeService } from '@/services/store-service';
import {
  EMPTY_STORE_SHIPPING,
  parseStoreShipping,
  type StoreShippingSettings,
} from '@/utils/store-shipping';
import { parseAuthPage } from '@/lib/auth-page';

interface PublicStoreInfo {
  id?: string;
  slug?: string;
  name?: string;
  tagline?: string;
  domain?: string;
  customDomain?: string;
  logo?: string;
  logoUrl?: string;
  favicon?: string;
  faviconUrl?: string;
  plan?: Tenant['plan'];
  planState?: Tenant['planState'];
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: Tenant['currency']['position'];
  theme?: Tenant['theme'];
  announcement?: string;
  announcementEnabled?: boolean;
  modules?: Tenant['modules'];
  contact?: Partial<Tenant['contact']>;
  socials?: Tenant['socials'];
  settings?: Tenant['settings'];
}

export interface TenantContextValue {
  tenant: Tenant;
  shipping: StoreShippingSettings;
  isSuspended: boolean;
  isLoading: boolean;
  formatPrice: (amount: number) => string;
  hasModule: (moduleKey: keyof TenantModules) => boolean;
  switchTenant: (slug: string) => void;
  refetchTenant: () => Promise<void>;
  availableTenants: Tenant[];
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  initialSlug = DEFAULT_TENANT_SLUG,
  children,
}: {
  initialSlug?: string;
  children: React.ReactNode;
}) {
  const [currentSlug, setCurrentSlug] = useState<string>(initialSlug);
  const [liveTenant, setLiveTenant] = useState<Tenant | null>(null);
  // Start loading so storefront never flashes mock announcement before API.
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fallbackTenant = useMemo(() => {
    return getTenantBySlug(currentSlug);
  }, [currentSlug]);

  const fetchTenantData = useCallback(async (slug: string) => {
    try {
      setIsLoading(true);
      const res = await storeService.getPublicStoreInfo(slug);
      if (res && res.data) {
        const raw = res.data as unknown as PublicStoreInfo;
        const mapped: Tenant = {
          id: raw.id || fallbackTenant.id,
          slug: raw.slug || slug,
          // Branding/contact: live API only — never inject mock Tanti defaults
          name: typeof raw.name === 'string' ? raw.name : '',
          tagline: typeof raw.tagline === 'string' ? raw.tagline : '',
          domain: raw.domain || fallbackTenant.domain,
          customDomain: raw.customDomain || fallbackTenant.customDomain,
          logoUrl:
            typeof raw.logo === 'string' && raw.logo.trim()
              ? raw.logo.trim()
              : typeof raw.logoUrl === 'string' && raw.logoUrl.trim()
                ? raw.logoUrl.trim()
                : undefined,
          faviconUrl:
            typeof raw.favicon === 'string' && raw.favicon.trim()
              ? raw.favicon.trim()
              : typeof raw.faviconUrl === 'string' && raw.faviconUrl.trim()
                ? raw.faviconUrl.trim()
                : undefined,
          plan: raw.plan || fallbackTenant.plan,
          planState: raw.planState || fallbackTenant.planState,
          currency: {
            code: raw.currency || fallbackTenant.currency.code,
            symbol: raw.currencySymbol || fallbackTenant.currency.symbol,
            rate: fallbackTenant.currency.rate || 1,
            position: raw.currencyPosition || fallbackTenant.currency.position,
          },
          theme: raw.theme || fallbackTenant.theme,
          announcement:
            typeof raw.announcement === 'string' ? raw.announcement : undefined,
          announcementEnabled:
            typeof raw.announcementEnabled === 'boolean'
              ? raw.announcementEnabled
              : false,
          authPage: parseAuthPage(raw.settings?.authPage),
          modules: raw.modules || fallbackTenant.modules,
          contact: {
            email: raw.contact?.email || '',
            phone: raw.contact?.phone || '',
            whatsapp: raw.contact?.whatsapp || '',
            address: raw.contact?.address || '',
            workingHours: raw.contact?.workingHours || '',
            responseTime: raw.contact?.responseTime || '',
            supportTeam: raw.contact?.supportTeam || '',
          },
          socials: raw.socials || {},
          shipping: parseStoreShipping(raw.settings?.shipping),
        };
        setLiveTenant(mapped);
      } else {
        setLiveTenant(null);
      }
    } catch {
      // Graceful fallback to mock data (without announcement)
      setLiveTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackTenant]);

  useEffect(() => {
    fetchTenantData(currentSlug);
  }, [currentSlug, fetchTenantData]);

  // Fallback tenant never carries branding/contact/announcement — only live API data may.
  const activeTenant = useMemo<Tenant>(() => {
    if (liveTenant) return liveTenant;
    return {
      ...fallbackTenant,
      name: '',
      tagline: '',
      logoUrl: undefined,
      faviconUrl: undefined,
      announcement: undefined,
      announcementEnabled: false,
      contact: {
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        workingHours: '',
        responseTime: '',
        supportTeam: '',
      },
      socials: {},
    };
  }, [liveTenant, fallbackTenant]);
  const isSuspended = activeTenant.planState === 'suspended';

  const formatPrice = useCallback(
    (amount: number) => {
      const { symbol, position } = activeTenant.currency;
      const formattedNum = amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return position === 'prefix'
        ? `${symbol}${formattedNum}`
        : `${formattedNum} ${symbol}`;
    },
    [activeTenant.currency]
  );

  const hasModule = useCallback(
    (moduleKey: keyof TenantModules): boolean => {
      return Boolean(activeTenant.modules?.[moduleKey]);
    },
    [activeTenant.modules]
  );

  const availableTenants = useMemo(() => Object.values(mockTenants), []);

  const refetchTenant = useCallback(async () => {
    await fetchTenantData(currentSlug);
  }, [currentSlug, fetchTenantData]);

  const shipping = useMemo(
    () => activeTenant.shipping ?? EMPTY_STORE_SHIPPING,
    [activeTenant.shipping]
  );

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: activeTenant,
      shipping,
      isSuspended,
      isLoading,
      formatPrice,
      hasModule,
      switchTenant: (slug: string) => setCurrentSlug(slug),
      refetchTenant,
      availableTenants,
    }),
    [
      activeTenant,
      shipping,
      isSuspended,
      isLoading,
      formatPrice,
      hasModule,
      refetchTenant,
      availableTenants,
    ]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    const fallback = mockTenants[DEFAULT_TENANT_SLUG];
    return {
      tenant: {
        ...fallback,
        name: '',
        logoUrl: undefined,
        faviconUrl: undefined,
        announcement: undefined,
        announcementEnabled: false,
        shipping: EMPTY_STORE_SHIPPING,
      },
      shipping: EMPTY_STORE_SHIPPING,
      isSuspended: false,
      isLoading: true,
      formatPrice: (amount: number) => `৳${amount.toLocaleString()}`,
      hasModule: () => true,
      switchTenant: () => {},
      refetchTenant: async () => {},
      availableTenants: Object.values(mockTenants),
    };
  }
  return ctx;
}
