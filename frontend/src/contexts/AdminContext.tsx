'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { roleMeta, rolePermissions } from '../data/admin';
import type { AdminModule, AdminRole, PermissionAction, PlanState } from '../types/commerce';
import { authService } from '@/services/auth';

export interface AdminContextValue {
  role: AdminRole;
  planState: PlanState;
  actor: string;
  can: (module: AdminModule, action?: PermissionAction) => boolean;
  readOnly: boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  role = 'owner',
  planState = 'active',
  children
}: {
  role?: AdminRole;
  planState?: PlanState;
  children: React.ReactNode;
}) {
  const value = useMemo<AdminContextValue>(() => {
    const perms = rolePermissions[role] ?? rolePermissions.owner;
    const readOnly = planState === 'suspended';
    const currentUser = typeof window !== 'undefined' ? authService.getStoredUser() : null;
    const actorName = currentUser?.name || currentUser?.email?.split('@')[0] || (role === 'owner' ? 'Owner' : 'Staff');
    return {
      role,
      planState,
      readOnly,
      actor: `${actorName} (${role.toUpperCase()})`,
      can: (module, action = 'view') => {
        if (module === 'billing' && role === 'owner') return true;
        if (readOnly && action !== 'view' && action !== 'export') return false;
        return perms[module]?.includes(action) ?? false;
      }
    };
  }, [role, planState]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    const currentUser = typeof window !== 'undefined' ? authService.getStoredUser() : null;
    const actorName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Owner';
    return {
      role: 'owner' as AdminRole,
      planState: 'active' as PlanState,
      actor: `${actorName} (OWNER)`,
      readOnly: false,
      can: () => true
    };
  }
  return ctx;
}
