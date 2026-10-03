// User domain model and profile contracts
import type { UserRole } from '@/constants/roles';

export type { UserRole };

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  initials?: string;
  phone?: string;
  title?: string;
  tenantId?: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  tenantId?: string;
  initials?: string;
  title?: string;
  avatar?: string;
}

export interface UserProfile extends StoredUser {
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'BLOCKED' | string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}
