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

export interface TenantContextValue {
  tenant: Tenant;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fallbackTenant = useMemo(() => {
    return getTenantBySlug(currentSlug);
  }, [currentSlug]);

  const fetchTenantData = useCallback(async (slug: string) => {
    try {
      setIsLoading(true);
      const res = await storeService.getPublicStoreInfo(slug);
      if (res && res.data) {
        const raw = res.data as any;
        const mapped: Tenant = {
          id: raw.id || fallbackTenant.id,
          slug: raw.slug || slug,
          name: raw.name || fallbackTenant.name,
          tagline: raw.tagline || fallbackTenant.tagline,
          domain: raw.domain || fallbackTenant.domain,
          customDomain: raw.customDomain || fallbackTenant.customDomain,
          logoUrl: raw.logo || raw.logoUrl || fallbackTenant.logoUrl,
          faviconUrl: raw.favicon || raw.faviconUrl || fallbackTenant.faviconUrl,
          plan: (raw.plan as any) || fallbackTenant.plan,
          planState: (raw.planState as any) || fallbackTenant.planState,
          currency: {
            code: raw.currency || fallbackTenant.currency.code,
            symbol: raw.currencySymbol || fallbackTenant.currency.symbol,
            rate: fallbackTenant.currency.rate || 1,
            position: raw.currencyPosition || fallbackTenant.currency.position,
          },
          theme: raw.theme || fallbackTenant.theme,
          modules: raw.modules || fallbackTenant.modules,
          contact: {
            email: raw.contact?.email || fallbackTenant.contact.email,
            phone: raw.contact?.phone || fallbackTenant.contact.phone,
            whatsapp: raw.contact?.whatsapp || fallbackTenant.contact.whatsapp,
            address: raw.contact?.address || fallbackTenant.contact.address,
            workingHours:
              raw.contact?.workingHours || fallbackTenant.contact.workingHours,
            responseTime:
              raw.contact?.responseTime || fallbackTenant.contact.responseTime,
            supportTeam:
              raw.contact?.supportTeam || fallbackTenant.contact.supportTeam,
          },
          socials: raw.socials || fallbackTenant.socials,
        };
        setLiveTenant(mapped);
      }
    } catch {
      // Graceful fallback to mock data
      setLiveTenant(null);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackTenant]);

  useEffect(() => {
    fetchTenantData(currentSlug);
  }, [currentSlug, fetchTenantData]);

  const activeTenant = liveTenant || fallbackTenant;
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

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: activeTenant,
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
      tenant: fallback,
      isSuspended: false,
      isLoading: false,
      formatPrice: (amount: number) => `৳${amount.toLocaleString()}`,
      hasModule: () => true,
      switchTenant: () => {},
      refetchTenant: async () => {},
      availableTenants: Object.values(mockTenants),
    };
  }
  return ctx;
}
