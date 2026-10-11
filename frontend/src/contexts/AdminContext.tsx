'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { rolePermissions } from '../data/admin';
import type { AdminModule, AdminRole, PermissionAction, PlanState } from '../types/commerce';
import { authService } from '@/services/auth';
import type { StoredUser } from '@/types/user';

export interface AdminContextValue {
  role: AdminRole;
  planState: PlanState;
  actor: string;
  can: (module: AdminModule, action?: PermissionAction) => boolean;
  readOnly: boolean;
  user: StoredUser | null;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  role,
  planState = 'active',
  children
}: {
  role?: AdminRole;
  planState?: PlanState;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => {
    if (typeof window !== 'undefined') {
      return authService.getStoredUser();
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = authService.getStoredUser();
      setCurrentUser(u);
    }
  }, []);

  const value = useMemo<AdminContextValue>(() => {
    const isStaffMember = Boolean(
      currentUser &&
      (currentUser.staffRole || (currentUser.permissions && Object.keys(currentUser.permissions).length > 0)) &&
      !currentUser.isOwner
    );

    const isOwner = !isStaffMember && Boolean(
      currentUser?.isOwner ||
      currentUser?.role === 'ADMIN' ||
      (currentUser?.role as any) === 'OWNER' ||
      (currentUser?.role as any) === 'SUPER_ADMIN' ||
      (!currentUser && role === 'owner')
    );

    const readOnly = planState === 'suspended';
    const actorName = currentUser?.name || currentUser?.email?.split('@')[0] || (isOwner ? 'Owner' : 'Staff');
    const displayRole = currentUser?.staffRole || (isOwner ? 'Owner' : 'Staff');

    return {
      role: isOwner ? 'owner' : (role || 'manager'),
      planState,
      readOnly,
      actor: `${actorName} (${displayRole.toUpperCase()})`,
      user: currentUser,
      can: (module: AdminModule, action: PermissionAction = 'view') => {
        // Owner has complete access
        if (isOwner) return true;

        if (module === 'billing') return false; // Non-owner staff cannot access billing

        if (readOnly && action !== 'view' && action !== 'export') return false;

        // Check assigned permissions from live database/session
        if (currentUser?.permissions && typeof currentUser.permissions === 'object') {
          const modPerms = currentUser.permissions[module] as string[] | undefined;
          if (Array.isArray(modPerms)) {
            return modPerms.includes(action);
          }
          return false;
        }

        // If staff member has no permissions for this module, reject
        if (isStaffMember) return false;

        // Fallback to preset rolePermissions only for non-staff presets
        const perms = rolePermissions[role || 'manager'] ?? rolePermissions.manager;
        return perms[module]?.includes(action) ?? false;
      }
    };
  }, [role, planState, currentUser]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    const currentUser = typeof window !== 'undefined' ? authService.getStoredUser() : null;
    const isStaffMember = Boolean(
      currentUser &&
      (currentUser.staffRole || (currentUser.permissions && Object.keys(currentUser.permissions).length > 0)) &&
      !currentUser.isOwner
    );
    const isOwner = !isStaffMember && Boolean(
      currentUser?.isOwner ||
      currentUser?.role === 'ADMIN' ||
      (currentUser?.role as any) === 'OWNER' ||
      (currentUser?.role as any) === 'SUPER_ADMIN'
    );
    const actorName = currentUser?.name || currentUser?.email?.split('@')[0] || 'Owner';
    return {
      role: (isOwner ? 'owner' : 'manager') as AdminRole,
      planState: 'active' as PlanState,
      actor: `${actorName} (${(currentUser?.staffRole || 'OWNER').toUpperCase()})`,
      readOnly: false,
      user: currentUser,
      can: (module: AdminModule, action: PermissionAction = 'view') => {
        if (isOwner) return true;
        if (module === 'billing') return false;
        if (currentUser?.permissions?.[module]) {
          return (currentUser.permissions[module] as string[]).includes(action);
        }
        return false;
      }
    };
  }
  return ctx;
}
