'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address, Customer } from '@/types/commerce';
import { authService } from '@/services/auth';
import { addressService } from '@/services/address-service';
import type { User } from './types';

const LOCAL_STORAGE_SAVED_ADDRESSES = 'tanti_saved_delivery_addresses';
const LOCAL_STORAGE_LAST_ADDRESS = 'tanti_last_delivery_address';

function mapStoredUser(stored: {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  role?: string;
}): User {
  return {
    id: stored.id,
    name: stored.name || stored.email?.split('@')[0] || 'User',
    email: stored.email,
    phone: stored.phone || '',
    role: stored.role,
  };
}

export function useStoreAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = authService.getStoredUser();
    return stored ? mapStoredUser(stored) : null;
  });

  // Stay true until client session bootstrap finishes (avoids sign-in flash on refresh)
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_ADDRESSES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isAddressesLoading, setIsAddressesLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Helper to load addresses from backend database for authenticated users
  const loadAddressesFromBackend = useCallback(async () => {
    const token = authService.getStoredUser();
    if (!token) {
      // Guest: Load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_ADDRESSES);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) setAddresses(parsed);
          }
        } catch {}
      }
      return;
    }

    try {
      setIsAddressesLoading(true);
      const res = await addressService.getAddresses();
      if (res?.data && Array.isArray(res.data)) {
        const mappedAddresses: Address[] = res.data.map((item) => ({
          id: item.id,
          label: item.label,
          name: item.name,
          phone: item.phone,
          line1: item.line1,
          district: item.district,
          area: item.area,
          isDefaultShipping: !!item.isDefaultShipping,
          isDefaultBilling: !!item.isDefaultBilling,
        }));
        setAddresses(mappedAddresses);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_SAVED_ADDRESSES, JSON.stringify(mappedAddresses));
        }
      }
    } catch (err) {
      console.warn('Could not load customer addresses from backend:', err);
    } finally {
      setIsAddressesLoading(false);
    }
  }, []);

  // Bootstrap session once on mount (storage + optional token refresh)
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        // Access token still valid — restore user immediately
        if (authService.isAuthenticated()) {
          const stored = authService.getStoredUser();
          if (stored && isMounted) {
            setUser(mapStoredUser(stored));
            loadAddressesFromBackend();
          }
          return;
        }

        // Access expired but refresh token present — wait before deciding signed-out
        if (authService.hasValidRefreshToken()) {
          const token = await authService.refreshToken();
          if (!isMounted) return;
          if (token) {
            const stored = authService.getStoredUser();
            if (stored) {
              setUser(mapStoredUser(stored));
              loadAddressesFromBackend();
            }
            return;
          }
        }

        // No usable session
        if (isMounted) {
          setUser(null);
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_ADDRESSES);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) setAddresses(parsed);
            }
          } catch {}
        }
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadAddressesFromBackend]);

  const login = useCallback((_email: string) => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser(mapStoredUser(stored));
      setIsAuthLoading(false);
      loadAddressesFromBackend();
    }
  }, [loadAddressesFromBackend]);

  const register = useCallback((u: Omit<User, 'id'>) => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser(mapStoredUser(stored));
      setIsAuthLoading(false);
      loadAddressesFromBackend();
    } else {
      setUser({ ...u, id: u.email, role: 'CUSTOMER' });
      setIsAuthLoading(false);
    }
  }, [loadAddressesFromBackend]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthLoading(false);
    setAddresses([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('tanti.cart');
        localStorage.removeItem('tanti.wishlist');
        localStorage.removeItem(LOCAL_STORAGE_SAVED_ADDRESSES);
        localStorage.removeItem(LOCAL_STORAGE_LAST_ADDRESS);
      } catch {}
    }
  }, []);

  const saveAddress = useCallback(async (a: Address) => {
    // 1. Optimistic local state update and localStorage sync
    let updatedAddresses: Address[] = [];
    setAddresses((prev) => {
      const exists = prev.some((x) => x.id === a.id);
      let next = exists ? prev.map((x) => (x.id === a.id ? a : x)) : [a, ...prev];
      if (a.isDefaultShipping) {
        next = next.map((x) => ({ ...x, isDefaultShipping: x.id === a.id }));
      }
      updatedAddresses = next;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_SAVED_ADDRESSES, JSON.stringify(next));
          localStorage.setItem(LOCAL_STORAGE_LAST_ADDRESS, JSON.stringify(a));
        } catch {}
      }
      return next;
    });

    // 2. Persist to Backend if logged in
    const stored = authService.getStoredUser();
    if (stored) {
      try {
        const isExistingInDb = a.id && !a.id.startsWith('a') && a.id.length > 10;
        if (isExistingInDb) {
          const res = await addressService.updateAddress(a.id, {
            label: a.label,
            name: a.name,
            phone: a.phone,
            line1: a.line1,
            district: a.district,
            area: a.area,
            isDefaultShipping: a.isDefaultShipping,
            isDefaultBilling: a.isDefaultBilling,
          });
          if (res?.data) {
            setAddresses((prev) => {
              const synced = prev.map((item) => (item.id === a.id ? { ...item, ...res.data } : item));
              if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_SAVED_ADDRESSES, JSON.stringify(synced));
              }
              return synced;
            });
          }
        } else {
          const res = await addressService.saveAddress({
            label: a.label || 'Home',
            name: a.name,
            phone: a.phone,
            line1: a.line1,
            district: a.district,
            area: a.area,
            isDefaultShipping: a.isDefaultShipping,
            isDefaultBilling: a.isDefaultBilling,
          });
          if (res?.data) {
            // Replace temporary optimistic ID with database generated UUID
            setAddresses((prev) => {
              const filtered = prev.filter((item) => item.id !== a.id);
              const mapped: Address = {
                id: res.data.id,
                label: res.data.label,
                name: res.data.name,
                phone: res.data.phone,
                line1: res.data.line1,
                district: res.data.district,
                area: res.data.area,
                isDefaultShipping: !!res.data.isDefaultShipping,
                isDefaultBilling: !!res.data.isDefaultBilling,
              };
              let next = [mapped, ...filtered];
              if (mapped.isDefaultShipping) {
                next = next.map((x) => ({ ...x, isDefaultShipping: x.id === mapped.id }));
              }
              if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_SAVED_ADDRESSES, JSON.stringify(next));
                localStorage.setItem(LOCAL_STORAGE_LAST_ADDRESS, JSON.stringify(mapped));
              }
              return next;
            });
            return res.data;
          }
        }
      } catch (error) {
        console.error('Failed to persist address to backend:', error);
      }
    }
    return a;
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    // 1. Optimistic local deletion & localStorage sync
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_SAVED_ADDRESSES, JSON.stringify(next));
        } catch {}
      }
      return next;
    });

    // 2. Persist to backend
    const stored = authService.getStoredUser();
    if (stored && id && !id.startsWith('a') && id.length > 10) {
      try {
        await addressService.deleteAddress(id);
      } catch (error) {
        console.error('Failed to delete address from backend:', error);
      }
    }
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    // 1. Optimistic local update
    setAddresses((prev) => {
      const next = prev.map((a) => ({ ...a, isDefaultShipping: a.id === id }));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_SAVED_ADDRESSES, JSON.stringify(next));
        } catch {}
      }
      return next;
    });

    // 2. Persist to backend
    const stored = authService.getStoredUser();
    if (stored && id && !id.startsWith('a') && id.length > 10) {
      try {
        await addressService.updateAddress(id, { isDefaultShipping: true });
      } catch (error) {
        console.error('Failed to update default address on backend:', error);
      }
    }
  }, []);

  const toggleCustomerStatus = useCallback((id: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
      )
    );
  }, []);

  return {
    user,
    setUser,
    isAuthLoading,
    addresses,
    isAddressesLoading,
    customers,
    login,
    register,
    logout,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    loadAddressesFromBackend,
    toggleCustomerStatus,
  };
}
