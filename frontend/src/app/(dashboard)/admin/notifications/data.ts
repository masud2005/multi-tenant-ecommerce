export interface TemplateVariable {
  tag: string;
  name: string;
  description: string;
  example: string;
}

export type NotificationChannel = 'email' | 'inApp';

export interface NotificationTemplate {
  id: string;
  event: string;
  group: 'Orders' | 'Shipping' | 'Inventory' | 'Returns' | 'Staff' | 'Reviews';
  description: string;
  email: boolean;
  inApp: boolean;
  emailSubject: string;
  emailBody: string;
  inAppTitle: string;
  inAppMessage: string;
  variables: TemplateVariable[];
}

export const samplePreviewData: Record<string, string> = {
  '{{customer_name}}': 'Rafiq Hossain',
  '{{order_number}}': '#TN-10498',
  '{{order_date}}': 'Today',
  '{{total_amount}}': '৳4,800',
  '{{items_summary}}': 'Premium Cotton Shirt, Silk Scarf',
  '{{shipping_address}}': 'Dhanmondi, Dhaka',
  '{{tracking_number}}': 'TRK-849201',
  '{{courier_name}}': 'Pathao Courier',
  '{{product_title}}': 'Premium Cotton Shirt',
  '{{variant_name}}': 'Blue / L',
  '{{remaining_stock}}': '3',
  '{{return_reason}}': 'Size mismatch',
  '{{staff_name}}': 'Sumona Yeasmin',
  '{{staff_role}}': 'Manager',
  '{{review_rating}}': '5',
  '{{review_text}}': 'Fabric quality is outstanding, highly recommended!',
  '{{store_name}}': 'Tanti Store',
  '{{support_email}}': 'support@tanti.com.bd',
};

const commonOrderVars: TemplateVariable[] = [
  { tag: '{{customer_name}}', name: 'Customer name', description: 'Full name of customer', example: 'Rafiq Hossain' },
  { tag: '{{order_number}}', name: 'Order number', description: 'Unique order identifier', example: '#TN-10498' },
  { tag: '{{total_amount}}', name: 'Total amount', description: 'Total order value', example: '৳4,800' },
  { tag: '{{items_summary}}', name: 'Items summary', description: 'Purchased products summary', example: '2 items' },
  { tag: '{{shipping_address}}', name: 'Shipping address', description: 'Customer address', example: 'Dhanmondi, Dhaka' },
  { tag: '{{store_name}}', name: 'Store name', description: 'Your store name', example: 'Tanti Store' },
];

export const initialNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'notif-1',
    event: 'New Order Received',
    group: 'Orders',
    description: 'Triggered when a customer completes checkout on your store.',
    email: true,
    inApp: true,
    emailSubject: '[New Order] {{order_number}} received ({{total_amount}})',
    emailBody: `Hi {{store_name}} Team,

A new order has been placed by {{customer_name}} for {{total_amount}}.

Order Number: {{order_number}}
Shipping Address: {{shipping_address}}
Items: {{items_summary}}

Please review and prepare the shipment from your Admin Dashboard.`,
    inAppTitle: 'New Order {{order_number}} 🛍️',
    inAppMessage: '{{customer_name}} placed an order for {{total_amount}}.',
    variables: commonOrderVars,
  },
  {
    id: 'notif-2',
    event: 'Order Shipped',
    group: 'Shipping',
    description: 'Triggered when order status is updated to Shipped with courier info.',
    email: true,
    inApp: true,
    emailSubject: 'Your order {{order_number}} is on the way! — {{store_name}}',
    emailBody: `Hi {{customer_name}},

Great news! Your order {{order_number}} has been dispatched via {{courier_name}}.

Tracking Number: {{tracking_number}}

Thank you for shopping with {{store_name}}!`,
    inAppTitle: 'Order {{order_number}} Shipped 🚚',
    inAppMessage: 'Your parcel is on the way via {{courier_name}} (Tracking: {{tracking_number}}).',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Customer name', example: 'Rafiq Hossain' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#TN-10498' },
      { tag: '{{courier_name}}', name: 'Courier name', description: 'Courier company', example: 'Pathao Courier' },
      { tag: '{{tracking_number}}', name: 'Tracking number', description: 'Tracking ID', example: 'TRK-849201' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Store' },
    ],
  },
  {
    id: 'notif-3',
    event: 'Order Delivered',
    group: 'Shipping',
    description: 'Triggered when customer order delivery is completed.',
    email: true,
    inApp: true,
    emailSubject: 'Order {{order_number}} Delivered — {{store_name}}',
    emailBody: `Hi {{customer_name}},

Your order {{order_number}} has been marked as delivered. We hope you love your purchase!

Warm regards,
{{store_name}} Team`,
    inAppTitle: 'Order {{order_number}} Delivered 🎉',
    inAppMessage: 'Order {{order_number}} has been successfully delivered.',
    variables: commonOrderVars,
  },
  {
    id: 'notif-4',
    event: 'Low Stock Alert',
    group: 'Inventory',
    description: 'Triggered when variant inventory quantity falls to 5 units or below.',
    email: false,
    inApp: true,
    emailSubject: 'Low Stock Alert: {{product_title}}',
    emailBody: `Warning: Inventory for {{product_title}} ({{variant_name}}) is low with only {{remaining_stock}} units left.`,
    inAppTitle: 'Low Stock Alert: {{product_title}} ⚠️',
    inAppMessage: 'Stock for variant "{{variant_name}}" is low ({{remaining_stock}} units remaining).',
    variables: [
      { tag: '{{product_title}}', name: 'Product title', description: 'Product title', example: 'Premium Cotton Shirt' },
      { tag: '{{variant_name}}', name: 'Variant title', description: 'Color/Size/SKU', example: 'Blue / L' },
      { tag: '{{remaining_stock}}', name: 'Remaining units', description: 'Current available stock', example: '3' },
    ],
  },
  {
    id: 'notif-5',
    event: 'Return Request Submitted',
    group: 'Returns',
    description: 'Triggered when a customer submits a return request on their order.',
    email: false,
    inApp: true,
    emailSubject: 'Return Request for Order {{order_number}}',
    emailBody: `Customer {{customer_name}} submitted a return request for order {{order_number}}. Reason: {{return_reason}}`,
    inAppTitle: 'Return Requested: {{order_number}} 🔄',
    inAppMessage: '{{customer_name}} requested a return for order {{order_number}} (Reason: {{return_reason}}).',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Customer name', example: 'Rafiq Hossain' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#TN-10498' },
      { tag: '{{return_reason}}', name: 'Return reason', description: 'Reason for return', example: 'Size mismatch' },
    ],
  },
  {
    id: 'notif-6',
    event: 'Staff Member Joined',
    group: 'Staff',
    description: 'Triggered when an invited staff member accepts invitation and registers.',
    email: false,
    inApp: true,
    emailSubject: 'New Staff Member Joined: {{staff_name}}',
    emailBody: `{{staff_name}} has accepted the invitation and joined your team as {{staff_role}}.`,
    inAppTitle: 'Staff Joined: {{staff_name}} 👤',
    inAppMessage: '{{staff_name}} accepted the invite and joined as {{staff_role}}.',
    variables: [
      { tag: '{{staff_name}}', name: 'Staff name', description: 'Staff member name', example: 'Sumona Yeasmin' },
      { tag: '{{staff_role}}', name: 'Staff role', description: 'Assigned role title', example: 'Manager' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Store' },
    ],
  },
  {
    id: 'notif-7',
    event: 'Product Review Submitted',
    group: 'Reviews',
    description: 'Triggered when a customer leaves a rating and review on a product.',
    email: false,
    inApp: true,
    emailSubject: 'New Review on {{product_title}}',
    emailBody: `{{customer_name}} left a {{review_rating}}-star review on {{product_title}}: "{{review_text}}"`,
    inAppTitle: 'New Review on {{product_title}} ⭐',
    inAppMessage: '{{customer_name}} rated {{review_rating}} ★: "{{review_text}}"',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Review author', example: 'Rafiq Hossain' },
      { tag: '{{product_title}}', name: 'Product title', description: 'Product title', example: 'Premium Cotton Shirt' },
      { tag: '{{review_rating}}', name: 'Star rating', description: 'Rating 1 to 5', example: '5' },
      { tag: '{{review_text}}', name: 'Review text', description: 'Customer feedback body', example: 'Fabric quality is outstanding!' },
    ],
  },
];
