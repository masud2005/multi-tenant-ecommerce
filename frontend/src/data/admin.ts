import { images } from './images';
import type { AdminModule, AdminRole, PermissionAction } from '../types/commerce';

const all: PermissionAction[] = ['view', 'create', 'update', 'delete'];
const allModules: AdminModule[] = [
  'dashboard', 'orders', 'returns', 'payments', 'products', 'categories', 'collections', 'brands', 'inventory',
  'customers', 'reviews', 'discounts', 'shipping', 'theme', 'content', 'media', 'analytics',
  'reports', 'staff', 'notifications', 'settings', 'audit'
];

export const rolePermissions: Record<AdminRole, Partial<Record<AdminModule, PermissionAction[]>>> = {
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
    audit: ['view']
  },
  fulfillment: {
    dashboard: ['view'],
    orders: ['view', 'update'],
    returns: ['view', 'update'],
    inventory: ['view', 'update'],
    shipping: ['view', 'update'],
    customers: ['view']
  }
};

export const roleMeta: Record<AdminRole, { name: string; person: string; email: string; initials: string }> = {
  owner: { name: 'Owner', person: 'Shahana Parvin', email: 'shahana@tanti.com.bd', initials: 'SP' },
  manager: { name: 'Store Manager', person: 'Farzana Yasmin', email: 'farzana@tanti.com.bd', initials: 'FY' },
  fulfillment: { name: 'Fulfillment Staff', person: 'Rahim Uddin', email: 'rahim@tanti.com.bd', initials: 'RU' }
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
  { key: 'audit', label: 'Audit logs' }
];

export const permissionActions: PermissionAction[] = all;

export const staff = [
  { id: 's1', name: 'Shahana Parvin', email: 'shahana@tanti.com.bd', role: 'Owner', status: 'active', lastActive: '2026-09-26T09:12:00', twoFactor: true },
  { id: 's2', name: 'Farzana Yasmin', email: 'farzana@tanti.com.bd', role: 'Store Manager', status: 'active', lastActive: '2026-09-26T08:40:00', twoFactor: true },
  { id: 's3', name: 'Rahim Uddin', email: 'rahim@tanti.com.bd', role: 'Fulfillment Staff', status: 'active', lastActive: '2026-09-26T07:55:00', twoFactor: false },
  { id: 's4', name: 'Mitu Akter', email: 'mitu@tanti.com.bd', role: 'Customer Care', status: 'active', lastActive: '2026-09-25T19:20:00', twoFactor: true },
  { id: 's5', name: 'Rakib Hasan', email: 'rakib@tanti.com.bd', role: 'Content Editor', status: 'deactivated', lastActive: '2026-08-12T15:00:00', twoFactor: false },
  { id: 's6', name: 'tasnim@tanti.com.bd', email: 'tasnim@tanti.com.bd', role: 'Content Editor', status: 'invited', lastActive: '', twoFactor: false }
];

export const roles = [
  { id: 'r1', name: 'Owner', members: 1, system: true, description: 'Full access to every module and staff.' },
  { id: 'r2', name: 'Store Manager', members: 1, system: false, description: 'Runs daily operations incl. refunds; no staff management.' },
  { id: 'r3', name: 'Fulfillment Staff', members: 1, system: false, description: 'Processes, packs and ships orders; manages stock.' },
  { id: 'r4', name: 'Customer Care', members: 1, system: false, description: 'Views orders and customers, handles returns and reviews.' },
  { id: 'r5', name: 'Content Editor', members: 2, system: false, description: 'Manages pages, blog, media and theme drafts.' }
];

export const discounts = [
  { id: 'd1', code: 'EID500', title: '৳500 off orders over ৳3,000', type: 'Fixed amount', method: 'code', status: 'active', used: 412, limit: 1000, starts: '2026-09-01', ends: '2026-10-05', revenue: 1582000 },
  { id: 'd2', code: 'TANTI10', title: '10% off entire order', type: 'Percentage', method: 'code', status: 'active', used: 1289, limit: null, starts: '2026-01-01', ends: '', revenue: 3410000 },
  { id: 'd3', code: 'FREESHIP', title: 'Free delivery, no minimum', type: 'Free shipping', method: 'code', status: 'active', used: 640, limit: null, starts: '2026-06-01', ends: '', revenue: 1120000 },
  { id: 'd4', code: '', title: 'Buy 2 panjabis, get 1 koti 50% off', type: 'Buy X get Y', method: 'automatic', status: 'scheduled', used: 0, limit: null, starts: '2026-10-01', ends: '2026-10-10', revenue: 0 },
  { id: 'd5', code: 'WELCOME15', title: '15% off first order', type: 'Percentage', method: 'code', status: 'active', used: 388, limit: null, starts: '2026-01-01', ends: '', revenue: 912000 },
  { id: 'd6', code: 'MONSOON20', title: '20% off Summer Linen', type: 'Percentage', method: 'code', status: 'expired', used: 721, limit: 800, starts: '2026-07-01', ends: '2026-08-31', revenue: 1640000 }
];

export const auditLogs = [
  { id: 'l1', at: '2026-09-26T09:14:00', actor: 'Shahana Parvin', action: 'Changed role permissions', resource: 'Role · Store Manager', category: 'Security', before: 'payments: view', after: 'payments: view, refund' },
  { id: 'l2', at: '2026-09-26T08:52:00', actor: 'Farzana Yasmin', action: 'Updated product price', resource: 'Product · Sage Cotton Panjabi', category: 'Catalog', before: 'Sale price ৳2,890', after: 'Sale price ৳2,690' },
  { id: 'l3', at: '2026-09-26T08:30:00', actor: 'Rahim Uddin', action: 'Adjusted stock (+24, Received)', resource: 'Variant · TN-P03-SAG-L', category: 'Inventory', before: 'Available 0', after: 'Available 24' },
  { id: 'l4', at: '2026-09-25T21:05:00', actor: 'System', action: 'Webhook delivery failed (retry 2/5)', resource: 'Webhook · order.created → ERP', category: 'Settings', before: '', after: 'HTTP 503' },
  { id: 'l5', at: '2026-09-25T18:40:00', actor: 'Farzana Yasmin', action: 'Issued partial refund ৳600', resource: 'Order · TN-10480', category: 'Payments', before: 'Paid ৳2,890', after: 'Refunded ৳600' },
  { id: 'l6', at: '2026-09-25T17:02:00', actor: 'Shahana Parvin', action: 'Signed in from new device', resource: 'Session · Chrome on macOS, Dhaka', category: 'Security', before: '', after: '' },
  { id: 'l7', at: '2026-09-25T15:30:00', actor: 'Shahana Parvin', action: 'Updated bKash credentials', resource: 'Payment settings · bKash', category: 'Settings', before: 'App key ••••4F2A', after: 'App key ••••91BC' },
  { id: 'l8', at: '2026-09-25T12:10:00', actor: 'Farzana Yasmin', action: 'Exported customers (CSV)', resource: 'Export · 2,418 rows', category: 'Data export', before: '', after: '' },
  { id: 'l9', at: '2026-09-24T19:20:00', actor: 'Rahim Uddin', action: 'Changed order status', resource: 'Order · TN-10493', category: 'Orders', before: 'Packed', after: 'Shipped' },
  { id: 'l10', at: '2026-09-24T11:00:00', actor: 'Shahana Parvin', action: 'Created API key', resource: 'API key · ERP sync (read:orders)', category: 'Settings', before: '', after: '' },
  { id: 'l11', at: '2026-09-23T08:15:00', actor: 'Unknown', action: '5 failed sign-in attempts — account locked 15 min', resource: 'Login · rahim@tanti.com.bd', category: 'Security', before: '', after: '' }
];

export const notificationTemplates = [
  { id: 'n1', event: 'Order confirmation', group: 'Orders', email: true, sms: true, push: false },
  { id: 'n2', event: 'Payment received', group: 'Payments', email: true, sms: false, push: false },
  { id: 'n3', event: 'Payment failed', group: 'Payments', email: true, sms: true, push: true },
  { id: 'n4', event: 'Order shipped', group: 'Shipping', email: true, sms: true, push: true },
  { id: 'n5', event: 'Out for delivery', group: 'Shipping', email: false, sms: true, push: true },
  { id: 'n6', event: 'Order delivered', group: 'Shipping', email: true, sms: true, push: false },
  { id: 'n7', event: 'Order cancelled', group: 'Orders', email: true, sms: true, push: false },
  { id: 'n8', event: 'Return approved', group: 'Returns', email: true, sms: true, push: false },
  { id: 'n9', event: 'Refund issued', group: 'Returns', email: true, sms: true, push: false },
  { id: 'n10', event: 'OTP verification', group: 'Account', email: false, sms: true, push: false },
  { id: 'n11', event: 'Password reset', group: 'Account', email: true, sms: false, push: false },
  { id: 'n12', event: 'Welcome / registration', group: 'Account', email: true, sms: false, push: false }
];

export const notificationLogs = [
  { id: 'nl1', at: '2026-09-26T09:02:00', channel: 'SMS', to: '01712-345678', event: 'Order shipped', status: 'delivered' },
  { id: 'nl2', at: '2026-09-26T08:58:00', channel: 'Email', to: 'tanvir.a@outlook.com', event: 'Order shipped', status: 'opened' },
  { id: 'nl3', at: '2026-09-26T08:41:00', channel: 'SMS', to: '01556-778899', event: 'Payment failed', status: 'failed' },
  { id: 'nl4', at: '2026-09-26T08:40:00', channel: 'Email', to: 'rafiq.h@gmail.com', event: 'Payment failed', status: 'delivered' },
  { id: 'nl5', at: '2026-09-25T20:15:00', channel: 'Push', to: 'Web · Chrome', event: 'Out for delivery', status: 'delivered' }
];

export const mediaAssets = [
  { id: 'm1', name: 'eid-hero-courtyard.jpg', url: images.hero, size: '412 KB', dims: '2400×1350', alt: 'Couple in festive kurta and panjabi in a sunlit courtyard', usedIn: 3 },
  { id: 'm2', name: 'indigo-kurta.jpg', url: images.kurta, size: '228 KB', dims: '1200×1600', alt: 'Woman wearing indigo block-print kurta set', usedIn: 2 },
  { id: 'm3', name: 'jamdani-cream.jpg', url: images.saree, size: '301 KB', dims: '1200×1600', alt: 'Cream jamdani saree with red border', usedIn: 2 },
  { id: 'm4', name: 'sage-panjabi.jpg', url: images.panjabi, size: '214 KB', dims: '1200×1600', alt: '', usedIn: 1 },
  { id: 'm5', name: 'leather-sneakers.jpg', url: images.sneakers, size: '160 KB', dims: '1200×1600', alt: 'White leather sneakers with tan heel', usedIn: 1 },
  { id: 'm6', name: 'tan-tote.jpg', url: images.bag, size: '188 KB', dims: '1200×1600', alt: 'Tan leather tote bag', usedIn: 1 },
  { id: 'm7', name: 'olive-coord.jpg', url: images.coord, size: '240 KB', dims: '1200×1600', alt: 'Woman in olive linen co-ord set', usedIn: 2 },
  { id: 'm8', name: 'silver-jhumka.jpg', url: images.jewelry, size: '176 KB', dims: '1200×1600', alt: '', usedIn: 1 },
  { id: 'm9', name: 'unused-banner-old.jpg', url: images.dupatta, size: '520 KB', dims: '2400×900', alt: '', usedIn: 0 }
];

export const reportCatalog: { group: string; items: { name: string; description: string }[] }[] = [
  {
    group: 'Sales',
    items: [
      { name: 'Sales over time', description: 'Gross, net, discounts and returns by day, week or month' },
      { name: 'Orders', description: 'Order count, status mix and AOV' },
      { name: 'Revenue breakdown', description: 'Product, shipping, tax and fee revenue' },
      { name: 'Tax', description: 'VAT collected by period and region' },
      { name: 'Payments', description: 'Sales by gateway, success and failure rates' }
    ]
  },
  {
    group: 'Catalog',
    items: [
      { name: 'Products', description: 'Units, revenue and margin per product' },
      { name: 'Categories', description: 'Performance by category' },
      { name: 'Variants', description: 'Size and colour performance' },
      { name: 'Inventory', description: 'Stock on hand, value and days of cover' },
      { name: 'Low stock', description: 'Variants at or below threshold' }
    ]
  },
  {
    group: 'Customers',
    items: [
      { name: 'Customers', description: 'New vs returning, LTV and cohorts' },
      { name: 'Reviews', description: 'Ratings distribution and moderation volume' },
      { name: 'Search', description: 'Top searches and zero-result queries' }
    ]
  },
  {
    group: 'Operations',
    items: [
      { name: 'Fulfillment', description: 'Time to pack and ship, SLA breaches' },
      { name: 'Shipping', description: 'Courier performance and delivery success' },
      { name: 'Returns', description: 'Return rate and reasons by product' },
      { name: 'Refunds', description: 'Refund value by method and reason' }
    ]
  },
  {
    group: 'Growth',
    items: [
      { name: 'Discounts & coupons', description: 'Usage and revenue attributed to each code' },
      { name: 'Staff activity', description: 'Actions by staff member' }
    ]
  }
];

export interface StockMovementItem {
  id: string;
  at: string;
  sku: string;
  product: string;
  change: number;
  stockAfter?: number;
  reason: string;
  by: string;
  ref?: string;
  note?: string;
}

export const stockMovements: StockMovementItem[] = [
  { id: 'sm1', at: '2026-09-26T08:30:00', sku: 'TN-P03-SAG-L', product: 'Sage Cotton Panjabi', change: 24, stockAfter: 36, reason: 'Received', by: 'Rahim Uddin', ref: 'PO-0412', note: 'Bulk shipment received from artisan workshop' },
  { id: 'sm2', at: '2026-09-25T15:47:00', sku: 'TN-P10-OLI-M', product: 'Olive Linen Co-ord Set', change: -1, stockAfter: 2, reason: 'Order', by: 'System', ref: 'TN-10496', note: 'Customer order checkout' },
  { id: 'sm3', at: '2026-09-25T11:00:00', sku: 'TN-P01-IND-L', product: 'Indigo Block-Print Kurta Set', change: -2, stockAfter: 0, reason: 'Damaged', by: 'Mitu Akter', ref: '', note: 'Defective stitching found during QC' },
  { id: 'sm4', at: '2026-09-24T17:20:00', sku: 'TN-P04-WHI-41', product: 'Everyday Leather Sneakers', change: -6, stockAfter: 12, reason: 'Correction', by: 'Rahim Uddin', ref: 'COR-088', note: 'Inventory reconciliation adjustment' },
  { id: 'sm5', at: '2026-09-24T17:20:00', sku: 'TN-P04-WHI-41', product: 'Everyday Leather Sneakers', change: 6, stockAfter: 18, reason: 'Received', by: 'Rahim Uddin', ref: 'PO-088', note: 'Stock delivery confirmation' },
  { id: 'sm6', at: '2026-09-23T10:00:00', sku: 'TN-P12-DUS-ONE', product: 'Hand-dyed Silk Dupatta', change: -1, stockAfter: 4, reason: 'Physical count', by: 'Mitu Akter', ref: 'CNT-19', note: 'Physical cycle count mismatch correction' }
];


export const themeVersions = [
  { id: 'tv4', label: 'Eid 2026 homepage', at: '2026-09-01T10:00:00', by: 'Shahana Parvin', live: true },
  { id: 'tv3', label: 'Monsoon linen banner', at: '2026-07-01T09:30:00', by: 'Rakib Hasan', live: false },
  { id: 'tv2', label: 'New header & mega-menu', at: '2026-05-12T12:00:00', by: 'Shahana Parvin', live: false }
];

export const entitlements = [
  { feature: 'Products', used: 142, limit: 500 },
  { feature: 'Staff accounts', used: 6, limit: 10 },
  { feature: 'Storage', used: 3.4, limit: 10, unit: 'GB' },
  { feature: 'Marketing emails / month', used: 28400, limit: 50000 }
];

export const planFeatures = [
  { name: 'Automated stock tracking', included: true },
  { name: 'Custom domain & SSL', included: true },
  { name: 'Advanced reports & exports', included: true },
  { name: 'API access & webhooks', included: true },
  { name: 'B2B wholesale pricing', included: false },
  { name: 'Multi-currency storefront', included: false }
];
