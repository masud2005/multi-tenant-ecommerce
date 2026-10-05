'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Address, Customer } from '@/types/commerce';
import { customers as seedCustomers, currentUserAddresses } from '@/data/customers';
import { authService } from '@/services/auth';
import type { User } from './types';

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

  const [addresses, setAddresses] = useState<Address[]>(currentUserAddresses);
  const [storeCredit] = useState(450);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);

  // Re-sync session state on mount
  useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser({
        id: stored.id,
        name: stored.name || stored.email?.split('@')[0] || 'User',
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      });
    }
  }, []);

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
    }
  }, []);

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
    } else {
      setUser({ ...u, id: u.email, role: 'CUSTOMER' });
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const saveAddress = useCallback((a: Address) => {
    setAddresses((prev) => {
      const exists = prev.some((x) => x.id === a.id);
      let next = exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a];
      if (a.isDefaultShipping) {
        next = next.map((x) => ({ ...x, isDefaultShipping: x.id === a.id }));
      }
      return next;
    });
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefaultShipping: a.id === id })));
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
    storeCredit,
    customers,
    login,
    register,
    logout,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    toggleCustomerStatus,
  };
}
