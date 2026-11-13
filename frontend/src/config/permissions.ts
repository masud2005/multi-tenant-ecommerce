import { UserRole } from '@/constants/roles';

export type PermissionAction =
  | 'view_dashboard'
  | 'manage_products'
  | 'view_products'
  | 'manage_categories'
  | 'manage_orders'
  | 'view_orders'
  | 'manage_customers'
  | 'manage_discounts'
  | 'manage_staff'
  | 'manage_settings'
  | 'view_analytics'
  | 'manage_storefront';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  OWNER: [
    'view_dashboard',
    'manage_products',
    'view_products',
    'manage_categories',
    'manage_orders',
    'view_orders',
    'manage_customers',
    'manage_discounts',
    'manage_staff',
    'manage_settings',
    'view_analytics',
    'manage_storefront',
  ],
  ADMIN: [
    'view_dashboard',
    'manage_products',
    'view_products',
    'manage_categories',
    'manage_orders',
    'view_orders',
    'manage_customers',
    'manage_discounts',
    'manage_settings',
    'view_analytics',
    'manage_storefront',
  ],
  MANAGER: [
    'view_dashboard',
    'manage_products',
    'view_products',
    'manage_categories',
    'manage_orders',
    'view_orders',
    'manage_customers',
  ],
  USER: [
    'view_orders',
  ],
  STAFF: [
    'view_dashboard',
    'manage_products',
    'view_products',
    'manage_categories',
    'manage_orders',
    'view_orders',
    'manage_customers',
  ],
  SUPER_ADMIN: [
    'view_dashboard',
    'manage_products',
    'view_products',
    'manage_categories',
    'manage_orders',
    'view_orders',
    'manage_customers',
    'manage_discounts',
    'manage_staff',
    'manage_settings',
    'view_analytics',
    'manage_storefront',
  ],
  CUSTOMER: [],
};

/**
 * Check if a role has permission to perform an action
 */
export function hasPermission(role: UserRole | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(action) : false;
}
