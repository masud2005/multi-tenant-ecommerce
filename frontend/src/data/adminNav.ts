import {
  LayoutDashboard,
  ShoppingCart,
  RotateCcw,
  CreditCard,
  Tag,
  FolderTree,
  Layers,
  Award,
  Warehouse,
  Users,
  Star,
  MessageSquare,
  Percent,
  Megaphone,
  Truck,
  Palette,
  FileText,
  Image as ImageIcon,
  Search,
  Globe,
  BarChart3,
  FileSpreadsheet,
  Shield,
  Bell,
  Plug,
  Settings,
  ScrollText,
  Gem,
  type LucideIcon
} from 'lucide-react';
import type { AdminModule, PermissionAction } from '../types/commerce';

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  module: AdminModule;
  action?: PermissionAction;
  end?: boolean;
  children?: { to: string; label: string; action?: PermissionAction }[];
}

export const adminNav: { group: string; items: AdminNavItem[] }[] = [
  { group: '', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', end: true }] },
  {
    group: 'Sales',
    items: [
      {
        to: '/admin/orders',
        label: 'Orders',
        icon: ShoppingCart,
        module: 'orders',
      },
      { to: '/admin/returns', label: 'Returns & exchanges', icon: RotateCcw, module: 'returns' },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard, module: 'payments' }
    ]
  },
  {
    group: 'Catalog',
    items: [
      {
        to: '/admin/products',
        label: 'Products',
        icon: Tag,
        module: 'products',
        children: [{ to: '/admin/products/import', label: 'Import / export', action: 'create' }]
      },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree, module: 'products' },
      { to: '/admin/collections', label: 'Collections', icon: Layers, module: 'products' },
      { to: '/admin/brands', label: 'Brands', icon: Award, module: 'products' },
      { to: '/admin/inventory', label: 'Inventory', icon: Warehouse, module: 'inventory' }
    ]
  },
  {
    group: 'Customers',
    items: [
      { to: '/admin/customers', label: 'Customers', icon: Users, module: 'customers' },
      { to: '/admin/reviews', label: 'Reviews', icon: Star, module: 'reviews' },
      { to: '/admin/messages', label: 'Inquiries & Messages', icon: MessageSquare, module: 'customers' }
    ]
  },
  {
    group: 'Growth',
    items: [
      { to: '/admin/discounts', label: 'Discounts', icon: Percent, module: 'discounts' },
      { to: '/admin/marketing', label: 'Marketing', icon: Megaphone, module: 'marketing' },
      { to: '/admin/shipping', label: 'Shipping', icon: Truck, module: 'shipping' }
    ]
  },
  {
    group: 'Online store',
    items: [
      { to: '/admin/theme', label: 'Theme', icon: Palette, module: 'theme' },
      { to: '/admin/content', label: 'Pages, blog & menus', icon: FileText, module: 'content' },
      { to: '/admin/media', label: 'Media', icon: ImageIcon, module: 'media' },
      { to: '/admin/seo', label: 'SEO', icon: Search, module: 'content' },
      { to: '/admin/domains', label: 'Domains', icon: Globe, module: 'domains' }
    ]
  },
  {
    group: 'Insights',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, module: 'analytics' },
      { to: '/admin/reports', label: 'Reports', icon: FileSpreadsheet, module: 'reports' }
    ]
  },
  {
    group: 'Administration',
    items: [
      { to: '/admin/staff', label: 'Staff & roles', icon: Shield, module: 'staff' },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell, module: 'notifications' },
      { to: '/admin/integrations', label: 'Integrations & API', icon: Plug, module: 'integrations' },
      { to: '/admin/settings', label: 'Settings', icon: Settings, module: 'settings' },
      { to: '/admin/audit', label: 'Audit logs', icon: ScrollText, module: 'audit' },
      { to: '/admin/billing', label: 'Plan & billing', icon: Gem, module: 'billing' }
    ]
  }
];
