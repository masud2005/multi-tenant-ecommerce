'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address, Customer } from '@/types/commerce';
import { authService } from '@/services/auth';
import { addressService } from '@/services/address-service';
import type { User } from './types';

const mapAddress = (item: {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  district: string;
  area: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}): Address => ({
  id: item.id,
  label: item.label,
  name: item.name,
  phone: item.phone,
  line1: item.line1,
  district: item.district,
  area: item.area,
  isDefaultShipping: !!item.isDefaultShipping,
  isDefaultBilling: !!item.isDefaultBilling,
});

export function useStoreAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = authService.getStoredUser();
    if (stored) {
      return {
        id: stored.id,
        name: stored.name || stored.email?.split('@')[0] || 'User',
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      };
    }
    return null;
  });

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [isAddressesLoading, setIsAddressesLoading] = useState<boolean>(false);
  const [storeCredit] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Helper to load addresses from backend database for authenticated users
  const loadAddressesFromBackend = useCallback(async () => {
    if (!authService.getStoredUser()) {
      setAddresses([]);
      return;
    }

    try {
      setIsAddressesLoading(true);
      const res = await addressService.getAddresses();
      if (res?.data && Array.isArray(res.data)) {
        setAddresses(res.data.map(mapAddress));
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.warn('Could not load customer addresses from backend:', err);
      setAddresses([]);
    } finally {
      setIsAddressesLoading(false);
    }
  }, []);

  // Re-sync session state and fetch addresses on mount and when user changes
  useEffect(() => {
    let isMounted = true;

    // Proactively refresh expired access token if valid refresh token exists
    if (!authService.isAuthenticated() && authService.hasValidRefreshToken()) {
      authService.refreshToken().then((token) => {
        if (!isMounted) return;
        if (token) {
          const stored = authService.getStoredUser();
          if (stored) {
            setUser({
              id: stored.id,
              name: stored.name || stored.email?.split('@')[0] || 'User',
              email: stored.email,
              phone: stored.phone || '',
              role: stored.role,
            });
            loadAddressesFromBackend();
          }
        }
      });
      return;
    }

    const stored = authService.getStoredUser();
    if (stored) {
      setUser({
        id: stored.id,
        name: stored.name || stored.email?.split('@')[0] || 'User',
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      });
      loadAddressesFromBackend();
    } else {
      setAddresses([]);
    }

    return () => {
      isMounted = false;
    };
  }, [loadAddressesFromBackend]);

  const login = useCallback((_email: string) => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser({
        id: stored.id,
        name: stored.name,
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      });
      loadAddressesFromBackend();
    }
  }, [loadAddressesFromBackend]);

  const register = useCallback((u: Omit<User, 'id'>) => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser({
        id: stored.id,
        name: stored.name,
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      });
      loadAddressesFromBackend();
    } else {
      setUser({ ...u, id: u.email, role: 'CUSTOMER' });
    }
  }, [loadAddressesFromBackend]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setAddresses([]);
  }, []);

  const saveAddress = useCallback(async (a: Address) => {
    if (!authService.getStoredUser()) {
      throw new Error('Please log in to save an address.');
    }

    const isExisting = Boolean(a.id && !a.id.startsWith('a') && a.id.length > 10);
    const payload = {
      label: a.label || 'Home',
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      district: a.district,
      area: a.area,
      isDefaultShipping: a.isDefaultShipping,
      isDefaultBilling: a.isDefaultBilling,
    };

    const res = isExisting
      ? await addressService.updateAddress(a.id, payload)
      : await addressService.saveAddress(payload);

    if (!res?.data?.id) {
      throw new Error('Could not save address.');
    }

    const mapped = mapAddress(res.data);
    setAddresses((prev) => {
      const rest = prev.filter((item) => item.id !== a.id && item.id !== mapped.id);
      const next = [mapped, ...rest];
      if (!mapped.isDefaultShipping) return next;
      return next.map((item) => ({ ...item, isDefaultShipping: item.id === mapped.id }));
    });
    return mapped;
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    await addressService.deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    const res = await addressService.updateAddress(id, { isDefaultShipping: true });
    if (!res?.data) throw new Error('Could not update the default address.');
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefaultShipping: a.id === id,
      }))
    );
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
    addresses,
    isAddressesLoading,
    storeCredit,
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
