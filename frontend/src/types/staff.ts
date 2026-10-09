// Staff & RBAC Role Domain Types
import type { PaginatedMeta } from './api';
import type { AdminModule, PermissionAction } from './commerce';

export type StaffStatus = 'active' | 'invited' | 'deactivated';

export type RolePermissionMatrix = Record<string, PermissionAction[] | string[]>;

export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  isOwner: boolean;
  status: StaffStatus;
  twoFactorEnabled: boolean;
  roleId: string | null;
  roleName: string;
  roleDescription?: string | null;
  isSystemRole: boolean;
  permissions: RolePermissionMatrix;
  invitedAt?: string | null;
  joinedAt?: string | null;
  lastActive?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: RolePermissionMatrix;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffCounters {
  total: number;
  active: number;
  invited: number;
  deactivated: number;
  seatsUsed: number;
  maxSeats: number;
}

export interface QueryStaffParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tenantId?: string;
}

export interface StaffListResponseData {
  members: StaffMember[];
  counters: StaffCounters;
  meta: PaginatedMeta;
}

export interface InviteStaffPayload {
  email: string;
  roleId: string;
  name?: string;
  password?: string;
  tenantId?: string;
}

export interface UpdateStaffPayload {
  roleId?: string;
  status?: StaffStatus;
  name?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: RolePermissionMatrix;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: RolePermissionMatrix;
}
