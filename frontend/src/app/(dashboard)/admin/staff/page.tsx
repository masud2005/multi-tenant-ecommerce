'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { UserPlus, ShieldCheck, Check, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import {
  staff as seedStaff,
  roles as seedRoles,
  rolePermissions,
  permissionModules,
  permissionActions,
} from '@/data/admin';
import { useAdmin } from '@/contexts/AdminContext';
import { PageHeader } from '@/components/dashboard/shared/PageHeader';
import { Panel } from '@/components/dashboard/shared/Panel';
import { GuardedButton } from '@/components/dashboard/shared/GuardedButton';
import { ModuleGate } from '@/components/dashboard/shared/ModuleGate';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';
import { staffService } from '@/services/staff-service';
import type { PermissionAction, AdminModule } from '@/types/commerce';

type Matrix = Record<string, PermissionAction[]>;

interface StaffRowItem {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string | null;
  status: 'active' | 'invited' | 'deactivated';
  lastActive: string;
  twoFactor: boolean;
  avatar?: string;
  isOwner?: boolean;
}

interface RoleItem {
  id: string;
  name: string;
  members: number;
  system: boolean;
  description: string;
  permissions?: Record<string, string[]>;
}

const presetRolePermissions: Record<string, Partial<Record<AdminModule, PermissionAction[]>>> = {
  Owner: Object.fromEntries(permissionModules.map((m) => [m.key, [...permissionActions]])),
  Administrator: Object.fromEntries(permissionModules.map((m) => [m.key, [...permissionActions]])),
  'Store Manager': rolePermissions.manager,
  'Fulfillment Staff': rolePermissions.fulfillment,
  'Customer Care': {
    dashboard: ['view'],
    orders: ['view', 'update'],
    returns: ['view', 'update'],
    customers: ['view', 'update'],
    reviews: ['view', 'update', 'delete'],
  },
  'Content Editor': {
    dashboard: ['view'],
    products: ['view', 'create', 'update'],
    categories: ['view', 'create', 'update'],
    collections: ['view', 'create', 'update'],
    brands: ['view', 'create', 'update'],
    theme: ['view', 'update'],
    content: ['view', 'create', 'update', 'delete'],
    media: ['view', 'create', 'update', 'delete'],
  },
};

function buildInitialMatrix(roleName: string): Matrix {
  if (roleName === 'Owner' || roleName === 'Administrator') {
    return Object.fromEntries(permissionModules.map((m) => [m.key, [...permissionActions]]));
  }
  const preset = presetRolePermissions[roleName] ?? {};
  return Object.fromEntries(
    permissionModules.map((m) => [
      m.key,
      [...(preset[m.key as AdminModule] ?? [])],
    ])
  );
}

function createEmptyMatrix(): Matrix {
  return Object.fromEntries(permissionModules.map((m) => [m.key, []]));
}

export default function AdminStaffPage() {
  const { can } = useAdmin();
  const [tab, setTab] = useState<'members' | 'roles'>('members');
  
  // State for Staff & Roles with initial fallback seeds
  const [members, setMembers] = useState<StaffRowItem[]>(seedStaff as StaffRowItem[]);
  const [roleList, setRoleList] = useState<RoleItem[]>(seedRoles as RoleItem[]);
  const [counters, setCounters] = useState({
    total: seedStaff.length,
    active: seedStaff.filter((s) => s.status === 'active').length,
    invited: seedStaff.filter((s) => s.status === 'invited').length,
    deactivated: seedStaff.filter((s) => s.status === 'deactivated').length,
    seatsUsed: seedStaff.length,
    maxSeats: 10,
  });

  // Modal / Drawer loading and form states
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Store Manager');
  const [isInviting, setIsInviting] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Active role & matrix state
  const [activeRole, setActiveRole] = useState('Store Manager');
  const [roleMatrices, setRoleMatrices] = useState<Record<string, Matrix>>(() => {
    const initial: Record<string, Matrix> = {};
    seedRoles.forEach((r) => {
      initial[r.name] = buildInitialMatrix(r.name);
    });
    return initial;
  });

  // Drawer state for creating new staff role
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleMatrix, setNewRoleMatrix] = useState<Matrix>(() => createEmptyMatrix());

  // Edit Role Details Modal State
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete Role Confirmation Modal State
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  // Real-time API data loader
  const loadData = useCallback(async () => {
    try {
      const [membersResult, rolesResult] = await Promise.allSettled([
        staffService.getStaffMembers(),
        staffService.getRoles(),
      ]);

      if (
        rolesResult.status === 'fulfilled' &&
        rolesResult.value?.success &&
        Array.isArray(rolesResult.value.data) &&
        rolesResult.value.data.length > 0
      ) {
        const liveRoles: RoleItem[] = rolesResult.value.data.map((r) => ({
          id: r.id,
          name: r.name,
          members: r.membersCount ?? 0,
          system: r.isSystem,
          description: r.description || '',
          permissions: r.permissions as any,
        }));

        setRoleList(liveRoles);

        setRoleMatrices((prev) => {
          const next = { ...prev };
          liveRoles.forEach((r) => {
            if (r.permissions && Object.keys(r.permissions).length > 0) {
              const formatted: Matrix = {};
              permissionModules.forEach((m) => {
                formatted[m.key] = (r.permissions?.[m.key] as PermissionAction[]) || [];
              });
              next[r.name] = formatted;
            } else if (!next[r.name]) {
              next[r.name] = buildInitialMatrix(r.name);
            }
          });
          return next;
        });

        if (!activeRole || !liveRoles.some((r) => r.name === activeRole)) {
          const firstNonOwner = liveRoles.find((r) => r.name !== 'Owner') || liveRoles[0];
          if (firstNonOwner) setActiveRole(firstNonOwner.name);
        }
      }

      if (
        membersResult.status === 'fulfilled' &&
        membersResult.value?.success &&
        membersResult.value.data?.members &&
        membersResult.value.data.members.length > 0
      ) {
        const liveMembers: StaffRowItem[] = membersResult.value.data.members.map((m) => ({
          id: m.id,
          name: m.name || m.email.split('@')[0],
          email: m.email,
          role: m.roleName || (m.isOwner ? 'Owner' : 'Store Manager'),
          roleId: m.roleId,
          status: m.status as any,
          lastActive: m.lastActive || m.joinedAt || '',
          twoFactor: m.twoFactorEnabled,
          avatar: m.avatar || undefined,
          isOwner: m.isOwner,
        }));

        setMembers(liveMembers);
        if (membersResult.value.data.counters) {
          setCounters(membersResult.value.data.counters);
        }
      }
    } catch {
      // Graceful fallback to seed data
    }
  }, [activeRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentRoleObj = roleList.find((r) => r.name === activeRole);
  const locked = activeRole === 'Owner' || !can('staff', 'update');
  const currentMatrix = roleMatrices[activeRole] ?? createEmptyMatrix();

  const handleOpenNewRoleDrawer = () => {
    setNewRoleName('');
    setNewRoleDesc('');
    const defaultNewMatrix = createEmptyMatrix();
    defaultNewMatrix['dashboard'] = ['view'];
    setNewRoleMatrix(defaultNewMatrix);
    setIsNewRoleOpen(true);
  };

  const handleCreateRole = async () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      toast.error('Please enter a role name');
      return;
    }
    if (roleList.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('A role with this name already exists');
      return;
    }

    try {
      setIsCreatingRole(true);
      const res = await staffService.createRole({
        name: trimmed,
        description: newRoleDesc.trim() || undefined,
        permissions: newRoleMatrix,
      });

      if (res && res.data) {
        const createdRole: RoleItem = {
          id: res.data.id,
          name: res.data.name || trimmed,
          members: 0,
          system: res.data.isSystem ?? false,
          description: res.data.description || newRoleDesc.trim() || 'Custom staff role.',
          permissions: (res.data.permissions as any) || newRoleMatrix,
        };

        setRoleList((prev) => [...prev, createdRole]);
        setRoleMatrices((prev) => ({
          ...prev,
          [createdRole.name]: newRoleMatrix,
        }));
        setActiveRole(createdRole.name);
        setIsNewRoleOpen(false);
        toast.success(`Role "${createdRole.name}" created and saved successfully!`);
      } else {
        throw new Error(res?.message || 'Failed to create role');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create role');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleOpenEditRoleModal = (r: RoleItem) => {
    setEditingRole(r);
    setEditRoleName(r.name);
    setEditRoleDesc(r.description || '');
    setIsEditRoleOpen(true);
  };

  const handleSaveEditRoleDetails = async () => {
    if (!editingRole) return;
    const trimmedName = editRoleName.trim();
    if (!trimmedName) {
      toast.error('Please enter a role name');
      return;
    }

    if (
      roleList.some(
        (r) => r.id !== editingRole.id && r.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      toast.error('Another role with this name already exists');
      return;
    }

    try {
      setIsUpdatingRole(true);
      if (editingRole.id && !editingRole.id.startsWith('r_')) {
        await staffService.updateRole(editingRole.id, {
          name: trimmedName,
          description: editRoleDesc.trim() || undefined,
        });
      }

      setRoleList((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? { ...r, name: trimmedName, description: editRoleDesc.trim() }
            : r
        )
      );

      // Re-map role matrices key if name changed
      if (editingRole.name !== trimmedName) {
        setRoleMatrices((prev) => {
          const next = { ...prev };
          next[trimmedName] = next[editingRole.name] || createEmptyMatrix();
          delete next[editingRole.name];
          return next;
        });
        if (activeRole === editingRole.name) {
          setActiveRole(trimmedName);
        }
      }

      toast.success(`Role "${trimmedName}" updated successfully`);
      setIsEditRoleOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleOpenDeleteRoleModal = (r: RoleItem) => {
    setDeletingRole(r);
    setIsDeleteRoleOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!deletingRole) return;

    if (deletingRole.system || deletingRole.name === 'Owner') {
      toast.error('System default roles cannot be deleted');
      return;
    }

    if (deletingRole.members > 0) {
      toast.error(
        `Cannot delete role "${deletingRole.name}" because it is currently assigned to ${deletingRole.members} staff member(s). Reassign them first.`
      );
      return;
    }

    try {
      setIsDeletingRole(true);
      if (deletingRole.id && !deletingRole.id.startsWith('r_')) {
        await staffService.deleteRole(deletingRole.id);
      }

      setRoleList((prev) => prev.filter((r) => r.id !== deletingRole.id));
      setRoleMatrices((prev) => {
        const next = { ...prev };
        delete next[deletingRole.name];
        return next;
      });

      if (activeRole === deletingRole.name) {
        const remaining = roleList.filter((r) => r.id !== deletingRole.id);
        setActiveRole(remaining[0]?.name || 'Store Manager');
      }

      toast.success(`Role "${deletingRole.name}" deleted successfully`);
      setIsDeleteRoleOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete role');
    } finally {
      setIsDeletingRole(false);
    }
  };

  const toggleActivePermission = (moduleKey: string, action: PermissionAction) => {
    if (locked) return;
    setRoleMatrices((prev) => {
      const matrixForRole = prev[activeRole] ?? createEmptyMatrix();
      const currentActions = matrixForRole[moduleKey] ?? [];
      const updatedActions = currentActions.includes(action)
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];

      return {
        ...prev,
        [activeRole]: {
          ...matrixForRole,
          [moduleKey]: updatedActions,
        },
      };
    });
  };

  const handleSavePermissions = async () => {
    if (locked) return;
    const targetRole = roleList.find((r) => r.name === activeRole);
    if (!targetRole) {
      toast.error('Role not found');
      return;
    }

    try {
      setIsSavingPermissions(true);
      if (targetRole.id && !targetRole.id.startsWith('r_')) {
        const res = await staffService.updateRole(targetRole.id, {
          permissions: currentMatrix,
        });
        if (res?.success) {
          toast.success(`Permissions saved for ${activeRole}`);
        } else {
          throw new Error(res?.message || 'Failed to save permissions');
        }
      } else {
        toast.success(`Permissions saved for ${activeRole}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleMemberStatus = async (s: StaffRowItem) => {
    if (s.isOwner || s.role === 'Owner') return;

    if (s.status === 'invited') {
      try {
        if (s.id && !s.id.startsWith('s_')) {
          await staffService.resendInvite(s.id);
        }
        toast.success(`Invitation email resent to ${s.email}`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to resend invitation email');
      }
      return;
    }

    const nextStatus = s.status === 'active' ? 'deactivated' : 'active';
    try {
      setMembers((prev) =>
        prev.map((m) => (m.id === s.id ? { ...m, status: nextStatus } : m))
      );

      if (s.id && !s.id.startsWith('s_')) {
        await staffService.updateStaffMember(s.id, { status: nextStatus });
      }

      toast.success(
        nextStatus === 'deactivated'
          ? `${s.name} deactivated — access revoked`
          : `${s.name} reactivated`
      );
    } catch (err: any) {
      setMembers((prev) =>
        prev.map((m) => (m.id === s.id ? { ...m, status: s.status } : m))
      );
      toast.error(err?.message || 'Failed to update member status');
    }
  };

  const handleRemoveMember = async (s: StaffRowItem) => {
    if (s.isOwner || s.role === 'Owner') return;
    try {
      if (s.id && !s.id.startsWith('s_')) {
        await staffService.removeStaffMember(s.id);
      }
      setMembers((prev) => prev.filter((m) => m.id !== s.id));
      setCounters((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        seatsUsed: Math.max(0, prev.seatsUsed - 1),
        active: s.status === 'active' ? Math.max(0, prev.active - 1) : prev.active,
        invited: s.status === 'invited' ? Math.max(0, prev.invited - 1) : prev.invited,
        deactivated: s.status === 'deactivated' ? Math.max(0, prev.deactivated - 1) : prev.deactivated,
      }));
      toast.success(`Staff member "${s.name}" removed from store`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove member');
    }
  };

  const handleInviteStaff = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const selectedRoleObj = roleList.find((r) => r.name === inviteRole);
    const roleId = selectedRoleObj?.id || 'role_default';

    try {
      setIsInviting(true);
      const res = await staffService.inviteStaff({
        email: email.trim(),
        roleId,
        name: email.trim().split('@')[0],
      });

      if (res?.success && res.data) {
        const newMember: StaffRowItem = {
          id: res.data.id,
          name: res.data.name || email.trim().split('@')[0],
          email: res.data.email,
          role: res.data.roleName || inviteRole,
          roleId: res.data.roleId || roleId,
          status: (res.data.status as any) || 'invited',
          lastActive: '',
          twoFactor: false,
          isOwner: false,
        };

        setMembers((prev) => [newMember, ...prev]);
        setCounters((prev) => ({
          ...prev,
          total: prev.total + 1,
          invited: prev.invited + 1,
          seatsUsed: prev.seatsUsed + 1,
        }));

        if (selectedRoleObj) {
          setRoleList((prev) =>
            prev.map((r) =>
              r.id === selectedRoleObj.id ? { ...r, members: r.members + 1 } : r
            )
          );
        }

        toast.success(`Invitation sent to ${email.trim()}`);
        setInvite(false);
        setEmail('');
      } else {
        throw new Error(res?.message || 'Failed to send invitation');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const toggleNewRolePermission = (moduleKey: string, action: PermissionAction) => {
    setNewRoleMatrix((prev) => {
      const currentActions = prev[moduleKey] ?? [];
      const updatedActions = currentActions.includes(action)
        ? currentActions.filter((a) => a !== action)
        : [...currentActions, action];
      return {
        ...prev,
        [moduleKey]: updatedActions,
      };
    });
  };

  const toggleNewRoleRowAll = (moduleKey: string) => {
    setNewRoleMatrix((prev) => {
      const current = prev[moduleKey] ?? [];
      const allSelected = permissionActions.every((a) => current.includes(a));
      return {
        ...prev,
        [moduleKey]: allSelected ? [] : [...permissionActions],
      };
    });
  };

  const selectAllNewRolePermissions = () => {
    setNewRoleMatrix(
      Object.fromEntries(permissionModules.map((m) => [m.key, [...permissionActions]]))
    );
  };

  const clearAllNewRolePermissions = () => {
    setNewRoleMatrix(createEmptyMatrix());
  };

  const setViewOnlyNewRolePermissions = () => {
    setNewRoleMatrix(
      Object.fromEntries(permissionModules.map((m) => [m.key, ['view']]))
    );
  };

  return (
    <ModuleGate module="staff">
      <div className="w-full space-y-6">
        <PageHeader
          title="Staff & roles"
          description={`${counters.seatsUsed || members.length} of ${counters.maxSeats || 10} staff seats used on your plan.`}
          actions={
            <GuardedButton
              module="staff"
              action="create"
              size="sm"
              onClick={() => setInvite(true)}
            >
              <UserPlus className="h-4 w-4" aria-hidden /> Invite staff
            </GuardedButton>
          }
        />
        <div className="mb-6">
          <Tabs
            value={tab}
            onChange={(val) => setTab(val as typeof tab)}
            tabs={[
              { value: 'members', label: 'Members' },
              { value: 'roles', label: 'Roles & permissions' },
            ]}
          />
        </div>

        {/* 1. Members Tab with serial-wise aligned columns in table */}
        {tab === 'members' && (
          <Panel flush>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-xs font-medium text-ink-muted">
                    <th scope="col" className="px-5 py-3">Member</th>
                    <th scope="col" className="px-5 py-3 w-48">Role</th>
                    <th scope="col" className="px-5 py-3 w-36">2FA</th>
                    <th scope="col" className="px-5 py-3 w-36">Status</th>
                    <th scope="col" className="px-5 py-3 w-36 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {members.map((s) => (
                    <tr key={s.id} className="hover:bg-subtle/30 transition-colors">
                      {/* Column 1: Member Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink">
                            {s.status === 'invited'
                              ? '@'
                              : s.name
                                  .split(' ')
                                  .map((x) => x[0])
                                  .join('')}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{s.name}</p>
                            <p className="text-xs text-ink-muted truncate">
                              {s.email}
                              {s.lastActive && ` · active ${timeAgo(s.lastActive)}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Role */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-ink-soft">
                        {s.role}
                      </td>

                      {/* Column 3: 2FA */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {s.twoFactor ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> 2FA
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">No 2FA</span>
                        )}
                      </td>

                      {/* Column 4: Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge
                          tone={
                            s.status === 'active'
                              ? 'success'
                              : s.status === 'invited'
                              ? 'info'
                              : 'neutral'
                          }
                          dot
                        >
                          {s.status}
                        </Badge>
                      </td>

                      {/* Column 5: Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {!s.isOwner && s.role !== 'Owner' ? (
                          <div className="inline-flex items-center justify-end gap-1">
                            <GuardedButton
                              module="staff"
                              action="update"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleMemberStatus(s)}
                            >
                              {s.status === 'invited'
                                ? 'Resend'
                                : s.status === 'active'
                                ? 'Deactivate'
                                : 'Reactivate'}
                            </GuardedButton>
                            <GuardedButton
                              module="staff"
                              action="delete"
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              title="Remove staff member"
                              onClick={() => handleRemoveMember(s)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </GuardedButton>
                          </div>
                        ) : (
                          <span className="inline-block px-3 text-xs text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* 2. Roles & Permissions Tab */}
        {tab === 'roles' && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Left side: Roles List */}
            <Panel
              title="Roles"
              flush
              actions={
                <GuardedButton
                  module="staff"
                  action="create"
                  size="sm"
                  variant="ghost"
                  onClick={handleOpenNewRoleDrawer}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> New
                </GuardedButton>
              }
            >
              <ul className="py-1 divide-y divide-line/40">
                {roleList.map((r) => {
                  const isCurrentActive = activeRole === r.name;
                  const isCustomRole = !r.system && r.name !== 'Owner' && r.name !== 'Administrator';
                  return (
                    <li key={r.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setActiveRole(r.name)}
                        aria-current={isCurrentActive}
                        className={cn(
                          'w-full px-5 py-2.5 text-left cursor-pointer transition-colors',
                          isCurrentActive ? 'bg-canvas' : 'hover:bg-canvas'
                        )}
                      >
                        <p className="text-sm font-medium text-ink flex items-center justify-between">
                          <span className="truncate pr-2">{r.name}</span>
                          <span className="font-normal text-xs text-ink-muted shrink-0">
                            · {r.members}
                          </span>
                        </p>
                        <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{r.description}</p>
                      </button>

                      {/* Quick action buttons for custom roles on hover */}
                      {isCustomRole && (
                        <div className="absolute right-2 top-2.5 hidden group-hover:flex items-center gap-1 bg-surface/90 backdrop-blur-xs px-1 py-0.5 rounded shadow-xs">
                          <button
                            type="button"
                            title="Edit Role Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditRoleModal(r);
                            }}
                            className="p-1 text-ink-muted hover:text-ink rounded hover:bg-subtle transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete Role"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteRoleModal(r);
                            }}
                            className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>

            {/* Right side: Active Role Permissions Table */}
            <Panel
              title={`${activeRole} permissions`}
              description={
                activeRole === 'Owner' || activeRole === 'Administrator'
                  ? 'System default roles have predefined access. Custom role permissions can be tailored freely.'
                  : currentRoleObj?.description || 'Changes apply immediately and are saved to database.'
              }
              flush
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {/* Edit details & Delete role buttons for custom roles */}
                  {currentRoleObj && !currentRoleObj.system && activeRole !== 'Owner' && activeRole !== 'Administrator' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditRoleModal(currentRoleObj)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleOpenDeleteRoleModal(currentRoleObj)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete role
                      </Button>
                    </>
                  )}

                  {!locked && (
                    <Button
                      size="sm"
                      loading={isSavingPermissions}
                      onClick={handleSavePermissions}
                    >
                      Save permissions
                    </Button>
                  )}
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-canvas/40 text-xs font-medium text-ink-muted">
                      <th scope="col" className="px-5 py-2.5 text-left font-medium">Module</th>
                      {permissionActions.map((a) => (
                        <th
                          key={a}
                          scope="col"
                          className="px-3 py-2.5 font-medium capitalize text-center w-24"
                        >
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {permissionModules.map((m) => (
                      <tr key={m.key} className="hover:bg-subtle/30 transition-colors">
                        <td className="px-5 py-2.5 font-medium text-ink">
                          {m.label}
                        </td>
                        {permissionActions.map((a) => {
                          const on = !!currentMatrix[m.key]?.includes(a);
                          return (
                            <td key={a} className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                disabled={locked}
                                aria-pressed={on}
                                aria-label={`${m.label} ${a}`}
                                onClick={() => toggleActivePermission(m.key, a)}
                                className={cn(
                                  'inline-flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer',
                                  on
                                    ? 'border-ink bg-ink text-canvas'
                                    : 'border-line-strong hover:border-ink',
                                  locked && 'opacity-60 cursor-not-allowed'
                                )}
                              >
                                {on && <Check className="h-3 w-3 stroke-[3]" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* Right-Side Drawer: Create New Staff Role */}
        <Drawer
          open={isNewRoleOpen}
          onClose={() => setIsNewRoleOpen(false)}
          title="Create Staff Role"
          subtitle="Define a custom role and configure module-level access permissions."
          side="right"
          width="max-w-2xl"
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              <Button
                variant="ghost"
                onClick={() => setIsNewRoleOpen(false)}
              >
                Cancel
              </Button>
              <Button
                loading={isCreatingRole}
                onClick={handleCreateRole}
                disabled={!newRoleName.trim()}
              >
                Create role
              </Button>
            </div>
          }
        >
          <div className="space-y-6 p-5">
            {/* Role Details */}
            <div className="space-y-4 rounded-lg border border-line bg-canvas/40 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Role Details
              </h3>
              <div className="space-y-3">
                <Input
                  label="Role Name"
                  placeholder="e.g. Operations Lead, Marketing Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
                <Input
                  label="Description"
                  placeholder="Brief summary of duties and permissions"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>
            </div>

            {/* Role Permissions Matrix */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Module Permissions</h3>
                  <p className="text-xs text-ink-muted">
                    Select actions allowed for each navigation page.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={selectAllNewRolePermissions}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={setViewOnlyNewRolePermissions}
                  >
                    View only
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={clearAllNewRolePermissions}
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="rounded-lg border border-line overflow-hidden bg-surface">
                <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                  <table className="w-full min-w-[540px] text-sm">
                    <thead className="sticky top-0 z-10 bg-canvas border-b border-line shadow-xs">
                      <tr className="text-xs font-medium text-ink-muted">
                        <th scope="col" className="px-4 py-2.5 text-left font-medium">Module</th>
                        {permissionActions.map((a) => (
                          <th
                            key={a}
                            scope="col"
                            className="px-2 py-2.5 font-medium capitalize text-center w-20"
                          >
                            {a}
                          </th>
                        ))}
                        <th scope="col" className="px-3 py-2.5 font-medium text-center w-16">Row</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {permissionModules.map((m) => {
                        const modulePerms = newRoleMatrix[m.key] ?? [];
                        const isAllRowSelected = permissionActions.every((a) =>
                          modulePerms.includes(a)
                        );

                        return (
                          <tr key={m.key} className="hover:bg-subtle/30 transition-colors">
                            <td className="px-4 py-2 text-ink font-medium">
                              {m.label}
                            </td>
                            {permissionActions.map((a) => {
                              const checked = modulePerms.includes(a);
                              return (
                                <td key={a} className="px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    aria-pressed={checked}
                                    aria-label={`${m.label} ${a}`}
                                    onClick={() => toggleNewRolePermission(m.key, a)}
                                    className={cn(
                                      'inline-flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer',
                                      checked
                                        ? 'border-ink bg-ink text-canvas'
                                        : 'border-line-strong hover:border-ink'
                                    )}
                                  >
                                    {checked && <Check className="h-3 w-3 stroke-[3]" />}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                title="Toggle all actions for this module"
                                onClick={() => toggleNewRoleRowAll(m.key)}
                                className="text-xs text-ink-muted hover:text-ink font-medium px-1.5 py-0.5 rounded hover:bg-subtle transition-colors cursor-pointer"
                              >
                                {isAllRowSelected ? 'None' : 'All'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Drawer>

        {/* Modal: Edit Role Details (Name & Description) */}
        <Modal
          open={isEditRoleOpen}
          onClose={() => setIsEditRoleOpen(false)}
          title={`Edit Role: ${editingRole?.name || ''}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsEditRoleOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={isUpdatingRole}
                disabled={!editRoleName.trim()}
                onClick={handleSaveEditRoleDetails}
              >
                Save changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Role Name"
              value={editRoleName}
              onChange={(e) => setEditRoleName(e.target.value)}
              placeholder="e.g. Inventory Supervisor"
              required
            />
            <Input
              label="Description"
              value={editRoleDesc}
              onChange={(e) => setEditRoleDesc(e.target.value)}
              placeholder="Responsibilities and access scope"
            />
          </div>
        </Modal>

        {/* Modal: Delete Role Confirmation */}
        <Modal
          open={isDeleteRoleOpen}
          onClose={() => setIsDeleteRoleOpen(false)}
          title="Delete Role Confirmation"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsDeleteRoleOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={isDeletingRole}
                disabled={deletingRole ? deletingRole.members > 0 : false}
                onClick={handleConfirmDeleteRole}
              >
                Delete role
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 text-red-800 dark:text-red-300 text-xs leading-relaxed">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">
                  Are you sure you want to delete &quot;{deletingRole?.name}&quot;?
                </p>
                <p className="mt-1">
                  This action cannot be undone. Custom permissions configured for this role will be permanently removed.
                </p>
              </div>
            </div>

            {deletingRole && deletingRole.members > 0 && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ⚠️ This role is currently assigned to {deletingRole.members} staff member(s). You must reassign them to another role before deleting.
              </p>
            )}
          </div>
        </Modal>

        {/* Modal: Invite staff */}
        <Modal
          open={invite}
          onClose={() => setInvite(false)}
          title="Invite staff member"
          footer={
            <>
              <Button variant="ghost" onClick={() => setInvite(false)}>
                Cancel
              </Button>
              <Button
                loading={isInviting}
                disabled={!/^\S+@\S+\.\S+$/.test(email)}
                onClick={handleInviteStaff}
              >
                Send invite
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-canvas/50 p-3 text-xs text-ink-muted leading-relaxed">
              <span className="font-semibold text-ink">How staff invites work:</span> An invitation link will be sent to this email. The recipient can click the link to set up their password and activate their account.
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@tanti.com.bd"
              hint="Must be an active email address they have access to."
            />
            <Select
              label="Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              options={roleList
                .filter((r) => r.name !== 'Owner')
                .map((r) => r.name)}
            />
          </div>
        </Modal>
      </div>
    </ModuleGate>
  );
}
