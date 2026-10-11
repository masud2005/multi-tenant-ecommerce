import { UserRole } from '@/constants/roles';
import type { AdminModule } from '@/types/commerce';

export interface NavChildItem {
  title: string;
  href: string;
  badge?: number | string;
  module?: AdminModule;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  category?: string;
  badge?: number | string;
  end?: boolean;
  module?: AdminModule;
  children?: NavChildItem[];
}

/**
 * Admin & Owner Navigation Items
 */
export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
    category: '',
    end: true,
    module: 'dashboard',
  },
  // Sales
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: 'ShoppingCart',
    category: 'Sales',
    badge: 5,
    module: 'orders',
  },
  {
    title: 'Returns & exchanges',
    href: '/admin/returns',
    icon: 'RotateCcw',
    category: 'Sales',
    badge: 2,
    module: 'returns',
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: 'CreditCard',
    category: 'Sales',
    module: 'payments',
  },
  // Catalog
  {
    title: 'Products',
    href: '/admin/products',
    icon: 'Tag',
    category: 'Catalog',
    module: 'products',
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: 'FolderTree',
    category: 'Catalog',
    module: 'products',
  },
  {
    title: 'Collections',
    href: '/admin/collections',
    icon: 'Layers',
    category: 'Catalog',
    module: 'products',
  },
  {
    title: 'Brands',
    href: '/admin/brands',
    icon: 'Award',
    category: 'Catalog',
    module: 'products',
  },
  {
    title: 'Inventory',
    href: '/admin/inventory',
    icon: 'Warehouse',
    category: 'Catalog',
    module: 'inventory',
  },
  // Customers
  {
    title: 'Customers',
    href: '/admin/customers',
    icon: 'Users',
    category: 'Customers',
    module: 'customers',
  },
  {
    title: 'Live Chat & Messages',
    href: '/admin/messages',
    icon: 'MessageSquare',
    category: 'Customers',
    module: 'customers',
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: 'Star',
    category: 'Customers',
    badge: 3,
    module: 'reviews',
  },
  // Growth
  {
    title: 'Discounts',
    href: '/admin/discounts',
    icon: 'Percent',
    category: 'Growth',
    module: 'discounts',
  },
  {
    title: 'Marketing',
    href: '/admin/marketing',
    icon: 'Megaphone',
    category: 'Growth',
    module: 'marketing',
  },
  {
    title: 'Shipping',
    href: '/admin/shipping',
    icon: 'Truck',
    category: 'Growth',
    module: 'shipping',
  },
  // Online store
  {
    title: 'Theme',
    href: '/admin/theme',
    icon: 'Palette',
    category: 'Online store',
    module: 'theme',
  },
  {
    title: 'Pages, blog & menus',
    href: '/admin/content',
    icon: 'FileText',
    category: 'Online store',
    module: 'content',
  },
  {
    title: 'Media',
    href: '/admin/media',
    icon: 'Image',
    category: 'Online store',
    module: 'media',
  },
  {
    title: 'SEO',
    href: '/admin/seo',
    icon: 'Search',
    category: 'Online store',
    module: 'content',
  },
  {
    title: 'Domains',
    href: '/admin/domains',
    icon: 'Globe',
    category: 'Online store',
    module: 'domains',
  },
  // Insights
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: 'BarChart3',
    category: 'Insights',
    module: 'analytics',
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: 'FileSpreadsheet',
    category: 'Insights',
    module: 'reports',
  },
  // Administration
  {
    title: 'Staff & roles',
    href: '/admin/staff',
    icon: 'Shield',
    category: 'Administration',
    module: 'staff',
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: 'Bell',
    category: 'Administration',
    module: 'notifications',
  },
  {
    title: 'Integrations & API',
    href: '/admin/integrations',
    icon: 'Plug',
    category: 'Administration',
    module: 'integrations',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
    category: 'Administration',
    module: 'settings',
  },
  {
    title: 'Audit logs',
    href: '/admin/audit',
    icon: 'ScrollText',
    category: 'Administration',
    module: 'audit',
  },
  {
    title: 'Plan & billing',
    href: '/admin/billing',
    icon: 'Gem',
    category: 'Administration',
    module: 'billing',
  },
];

/**
 * Manager Navigation Items
 */
export const managerNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/manager',
    icon: 'LayoutDashboard',
    category: '',
    end: true,
    module: 'dashboard',
  },
  // Sales
  {
    title: 'Orders',
    href: '/manager/orders',
    icon: 'ShoppingCart',
    category: 'Sales',
    badge: 5,
    module: 'orders',
  },
  {
    title: 'Returns & exchanges',
    href: '/manager/returns',
    icon: 'RotateCcw',
    category: 'Sales',
    module: 'returns',
  },
  // Catalog
  {
    title: 'Products',
    href: '/manager/products',
    icon: 'Tag',
    category: 'Catalog',
    module: 'products',
  },
  {
    title: 'Categories',
    href: '/manager/categories',
    icon: 'FolderTree',
    category: 'Catalog',
    module: 'products',
  },
  {
    title: 'Inventory',
    href: '/manager/inventory',
    icon: 'Warehouse',
    category: 'Catalog',
    module: 'inventory',
  },
  // Customers
  {
    title: 'Customers',
    href: '/manager/customers',
    icon: 'Users',
    category: 'Customers',
    module: 'customers',
  },
  {
    title: 'Reviews',
    href: '/manager/reviews',
    icon: 'Star',
    category: 'Customers',
    module: 'reviews',
  },
  // Insights
  {
    title: 'Reports',
    href: '/manager/reports',
    icon: 'FileSpreadsheet',
    category: 'Insights',
    module: 'reports',
  },
];

/**
 * User / Customer Navigation Items
 */
export const userNavItems: NavItem[] = [
  {
    title: 'Overview',
    href: '/account',
    icon: 'LayoutDashboard',
    category: '',
    end: true,
  },
  {
    title: 'My Orders',
    href: '/account/orders',
    icon: 'Package',
    category: 'Purchases',
  },
  {
    title: 'Wishlist',
    href: '/wishlist',
    icon: 'Heart',
    category: 'Purchases',
  },
  {
    title: 'Addresses',
    href: '/account/addresses',
    icon: 'MapPin',
    category: 'Account',
  },
  {
    title: 'Profile Settings',
    href: '/account/profile',
    icon: 'User',
    category: 'Account',
  },
];

/**
 * Resolve navigation items according to user role
 */
export function getNavItemsByRole(role?: UserRole | string): NavItem[] {
  const r = (role || '').toUpperCase();
  switch (r) {
    case 'OWNER':
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'STAFF':
    case 'MANAGER':
      return adminNavItems;
    case 'USER':
    case 'CUSTOMER':
      return userNavItems;
    default:
      return adminNavItems;
  }
}
