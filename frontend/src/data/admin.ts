import type { AdminModule, AdminRole, PermissionAction } from '../types/commerce';

const all: PermissionAction[] = ['view', 'create', 'update', 'delete'];
const allModules: AdminModule[] = [
  'dashboard',
  'orders',
  'returns',
  'payments',
  'products',
  'categories',
  'collections',
  'brands',
  'inventory',
  'customers',
  'reviews',
  'discounts',
  'shipping',
  'theme',
  'content',
  'media',
  'analytics',
  'reports',
  'staff',
  'notifications',
  'settings',
  'audit',
];

/** Static RBAC matrix for owner/manager/fulfillment role templates in Staff UI. */
export const rolePermissions: Record<
  AdminRole,
  Partial<Record<AdminModule, PermissionAction[]>>
> = {
  owner: Object.fromEntries(allModules.map((m) => [m, all])),
  manager: {
    dashboard: ['view'],
    orders: ['view', 'create', 'update', 'delete'],
    returns: ['view', 'create', 'update'],
    payments: ['view'],
    products: ['view', 'create', 'update', 'delete'],
    categories: ['view', 'create', 'update', 'delete'],
    collections: ['view', 'create', 'update', 'delete'],
    brands: ['view', 'create', 'update', 'delete'],
    inventory: ['view', 'create', 'update'],
    customers: ['view', 'create', 'update'],
    reviews: ['view', 'update', 'delete'],
    discounts: ['view', 'create', 'update', 'delete'],
    shipping: ['view', 'update'],
    theme: ['view', 'update'],
    content: ['view', 'create', 'update', 'delete'],
    media: ['view', 'create', 'update', 'delete'],
    analytics: ['view'],
    reports: ['view'],
    notifications: ['view'],
    audit: ['view'],
  },
  fulfillment: {
    dashboard: ['view'],
    orders: ['view', 'update'],
    returns: ['view', 'update'],
    inventory: ['view', 'update'],
    shipping: ['view', 'update'],
    customers: ['view'],
  },
};

/** Role display titles only (no fake person/email seed). */
export const roleMeta: Record<AdminRole, { name: string }> = {
  owner: { name: 'Owner' },
  manager: { name: 'Store Manager' },
  fulfillment: { name: 'Fulfillment Staff' },
};

export const permissionModules: { key: AdminModule; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'returns', label: 'Returns & exchanges' },
  { key: 'payments', label: 'Payments' },
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'collections', label: 'Collections' },
  { key: 'brands', label: 'Brands' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customers', label: 'Customers' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'theme', label: 'Theme' },
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'reports', label: 'Reports' },
  { key: 'staff', label: 'Staff & roles' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'settings', label: 'Settings' },
  { key: 'audit', label: 'Audit logs' },
];

export const permissionActions: PermissionAction[] = all;
