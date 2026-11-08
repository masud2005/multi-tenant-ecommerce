export type NotificationTemplateVariableDef = {
  tag: string;
  name: string;
  description: string;
  example: string;
};

export type NotificationTemplateDef = {
  key: string;
  event: string;
  group: string;
  description: string;
  email: boolean;
  inApp: boolean;
  subject: string;
  body: string;
  inAppTitle: string;
  inAppMessage: string;
  variables: NotificationTemplateVariableDef[];
};

const orderVars: NotificationTemplateVariableDef[] = [
  {
    tag: '{{customer_name}}',
    name: 'Customer name',
    description: 'Full name of the customer',
    example: 'Rafiq Hossain',
  },
  {
    tag: '{{order_number}}',
    name: 'Order number',
    description: 'Store order number',
    example: 'TN-10498',
  },
  {
    tag: '{{total_amount}}',
    name: 'Total amount',
    description: 'Order grand total',
    example: '৳4,800',
  },
  {
    tag: '{{items_summary}}',
    name: 'Items summary',
    description: 'Short list of purchased items',
    example: 'Premium Cotton Shirt, Silk Scarf',
  },
  {
    tag: '{{shipping_address}}',
    name: 'Shipping address',
    description: 'Delivery address summary',
    example: 'Dhanmondi, Dhaka',
  },
  {
    tag: '{{store_name}}',
    name: 'Store name',
    description: 'Your store brand name',
    example: 'Tanti Fashion',
  },
  {
    tag: '{{payment_method}}',
    name: 'Payment method',
    description: 'How the order was paid',
    example: 'bKash',
  },
];

/** Canonical templates for a manual-fulfillment store (Email + In-App only). */
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplateDef[] = [
  {
    key: 'NEW_ORDER',
    event: 'New Order Received',
    group: 'Orders',
    description: 'Notifies store staff when a customer completes checkout.',
    email: true,
    inApp: true,
    subject: '[New Order] {{order_number}} received ({{total_amount}})',
    body: `Hi {{store_name}} Team,

A new order has been placed by {{customer_name}} for {{total_amount}}.

Order Number: {{order_number}}
Payment: {{payment_method}}
Shipping Address: {{shipping_address}}
Items: {{items_summary}}

Review and prepare the shipment from your Admin Dashboard.`,
    inAppTitle: 'New Order {{order_number}}',
    inAppMessage: '{{customer_name}} placed an order for {{total_amount}}.',
    variables: orderVars,
  },
  {
    key: 'ORDER_CONFIRMED',
    event: 'Order Confirmed',
    group: 'Orders',
    description: 'Confirms to the customer that their order was received.',
    email: true,
    inApp: true,
    subject: 'Order confirmed {{order_number}} — {{store_name}}',
    body: `Hi {{customer_name}},

Thank you for shopping with {{store_name}}!

We have received your order {{order_number}} for {{total_amount}}.
Payment method: {{payment_method}}
Delivery to: {{shipping_address}}

Items: {{items_summary}}

We will update you when your order is on the way.`,
    inAppTitle: 'Order {{order_number}} confirmed',
    inAppMessage: 'Thanks! We received your order for {{total_amount}}.',
    variables: orderVars,
  },
  {
    key: 'ORDER_CANCELLED',
    event: 'Order Cancelled',
    group: 'Orders',
    description: 'Sent when an order is cancelled by the store or customer flow.',
    email: true,
    inApp: true,
    subject: 'Order {{order_number}} cancelled — {{store_name}}',
    body: `Hi {{customer_name}},

Your order {{order_number}} has been cancelled.

If you did not request this or need help, reply to this email or contact {{store_name}} support.

Total was {{total_amount}}.`,
    inAppTitle: 'Order {{order_number}} cancelled',
    inAppMessage: 'Your order {{order_number}} has been cancelled.',
    variables: orderVars,
  },
  {
    key: 'PAYMENT_FAILED',
    event: 'Payment Failed',
    group: 'Orders',
    description:
      'Sent when a manual bKash/Nagad payment is rejected or cannot be verified.',
    email: true,
    inApp: true,
    subject: 'Payment could not be verified for {{order_number}} — {{store_name}}',
    body: `Hi {{customer_name}},

We could not verify payment for order {{order_number}} ({{total_amount}}).

If you already sent money via bKash or Nagad, please contact {{store_name}} with your TrxID. Do not send payment again unless asked.

— {{store_name}}`,
    inAppTitle: 'Payment not verified for {{order_number}}',
    inAppMessage:
      'We could not verify payment for order {{order_number}}. Contact the store with your TrxID if needed.',
    variables: orderVars,
  },
  {
    key: 'ORDER_SHIPPED',
    event: 'Order Shipped',
    group: 'Shipping',
    description:
      'Sent when admin marks an order shipped / out for delivery (manual courier + tracking).',
    email: true,
    inApp: true,
    subject: 'Your order {{order_number}} is on the way — {{store_name}}',
    body: `Hi {{customer_name}},

Great news! Your order {{order_number}} has been dispatched.

Courier: {{courier_name}}
Tracking: {{tracking_number}}

Thank you for shopping with {{store_name}}.`,
    inAppTitle: 'Order {{order_number}} shipped',
    inAppMessage:
      'Your parcel is on the way via {{courier_name}} (Tracking: {{tracking_number}}).',
    variables: [
      ...orderVars.filter((v) =>
        ['{{customer_name}}', '{{order_number}}', '{{store_name}}'].includes(
          v.tag,
        ),
      ),
      {
        tag: '{{courier_name}}',
        name: 'Courier name',
        description: 'Courier entered by admin when shipping',
        example: 'Sundarban Courier',
      },
      {
        tag: '{{tracking_number}}',
        name: 'Tracking number',
        description: 'Manual tracking / consignment id',
        example: 'SB-849201',
      },
    ],
  },
  {
    key: 'ORDER_DELIVERED',
    event: 'Order Delivered',
    group: 'Shipping',
    description: 'Sent when admin marks the order as delivered.',
    email: true,
    inApp: true,
    subject: 'Order {{order_number}} delivered — {{store_name}}',
    body: `Hi {{customer_name}},

Your order {{order_number}} has been marked as delivered. We hope you love your purchase!

Need a size exchange or help? Contact {{store_name}} support.

Warm regards,
{{store_name}} Team`,
    inAppTitle: 'Order {{order_number}} delivered',
    inAppMessage: 'Order {{order_number}} was successfully delivered.',
    variables: orderVars,
  },
  {
    key: 'RETURN_REQUESTED',
    event: 'Return Request Submitted',
    group: 'Returns',
    description: 'Notifies staff when a customer submits a return request.',
    email: true,
    inApp: true,
    subject: 'Return request for order {{order_number}}',
    body: `Hi {{store_name}} Team,

{{customer_name}} submitted a return request for order {{order_number}}.

Reason: {{return_reason}}

Review it in Admin → Returns.`,
    inAppTitle: 'Return requested: {{order_number}}',
    inAppMessage:
      '{{customer_name}} requested a return for {{order_number}} ({{return_reason}}).',
    variables: [
      {
        tag: '{{customer_name}}',
        name: 'Customer name',
        description: 'Customer name',
        example: 'Rafiq Hossain',
      },
      {
        tag: '{{order_number}}',
        name: 'Order number',
        description: 'Order ID',
        example: 'TN-10498',
      },
      {
        tag: '{{return_reason}}',
        name: 'Return reason',
        description: 'Reason provided by customer',
        example: 'Size mismatch',
      },
      {
        tag: '{{store_name}}',
        name: 'Store name',
        description: 'Store name',
        example: 'Tanti Fashion',
      },
    ],
  },
  {
    key: 'RETURN_UPDATED',
    event: 'Return Status Updated',
    group: 'Returns',
    description:
      'Sent to the customer when admin approves, rejects, refunds, or exchanges a return.',
    email: true,
    inApp: true,
    subject: 'Return update for {{order_number}}: {{return_status}} — {{store_name}}',
    body: `Hi {{customer_name}},

Your return request for order {{order_number}} is now: {{return_status}}.

{{return_note}}

— {{store_name}}`,
    inAppTitle: 'Return {{order_number}}: {{return_status}}',
    inAppMessage: 'Your return for {{order_number}} is now {{return_status}}.',
    variables: [
      {
        tag: '{{customer_name}}',
        name: 'Customer name',
        description: 'Customer name',
        example: 'Rafiq Hossain',
      },
      {
        tag: '{{order_number}}',
        name: 'Order number',
        description: 'Order ID',
        example: 'TN-10498',
      },
      {
        tag: '{{return_status}}',
        name: 'Return status',
        description: 'Approved, Rejected, Refunded, etc.',
        example: 'Approved',
      },
      {
        tag: '{{return_note}}',
        name: 'Return note',
        description: 'Optional note from admin',
        example: 'Pickup scheduled within 48 hours.',
      },
      {
        tag: '{{store_name}}',
        name: 'Store name',
        description: 'Store name',
        example: 'Tanti Fashion',
      },
    ],
  },
  {
    key: 'LOW_STOCK',
    event: 'Low Stock Alert',
    group: 'Inventory',
    description: 'Alerts staff when a variant hits its low-stock threshold.',
    email: true,
    inApp: true,
    subject: 'Low stock: {{product_title}} ({{variant_name}})',
    body: `Warning: inventory for {{product_title}} ({{variant_name}}) is low.

Remaining units: {{remaining_stock}}

Restock from Admin → Inventory.`,
    inAppTitle: 'Low stock: {{product_title}}',
    inAppMessage:
      'Variant "{{variant_name}}" is low ({{remaining_stock}} units left).',
    variables: [
      {
        tag: '{{product_title}}',
        name: 'Product title',
        description: 'Product name',
        example: 'Premium Cotton Shirt',
      },
      {
        tag: '{{variant_name}}',
        name: 'Variant',
        description: 'Color / size / SKU',
        example: 'Blue / L',
      },
      {
        tag: '{{remaining_stock}}',
        name: 'Remaining units',
        description: 'Current available stock',
        example: '3',
      },
    ],
  },
  {
    key: 'NEW_REVIEW',
    event: 'Product Review Submitted',
    group: 'Reviews',
    description: 'Notifies staff when a customer leaves a product review.',
    email: false,
    inApp: true,
    subject: 'New review on {{product_title}}',
    body: `{{customer_name}} left a {{review_rating}}-star review on {{product_title}}:

"{{review_text}}"

Moderate it in Admin → Reviews.`,
    inAppTitle: 'New review on {{product_title}}',
    inAppMessage: '{{customer_name}} rated {{review_rating}} ★: "{{review_text}}"',
    variables: [
      {
        tag: '{{customer_name}}',
        name: 'Customer name',
        description: 'Review author',
        example: 'Rafiq Hossain',
      },
      {
        tag: '{{product_title}}',
        name: 'Product title',
        description: 'Product name',
        example: 'Premium Cotton Shirt',
      },
      {
        tag: '{{review_rating}}',
        name: 'Star rating',
        description: 'Rating 1 to 5',
        example: '5',
      },
      {
        tag: '{{review_text}}',
        name: 'Review text',
        description: 'Customer feedback',
        example: 'Fabric quality is outstanding!',
      },
    ],
  },
  {
    key: 'NEW_SUPPORT_MESSAGE',
    event: 'New Support Message',
    group: 'Support',
    description: 'Notifies staff when a customer sends a support chat message.',
    email: false,
    inApp: true,
    subject: 'New message from {{customer_name}}',
    body: `{{customer_name}} sent a support message:

"{{message_preview}}"

Open Admin → Messages to reply.`,
    inAppTitle: 'New message from {{customer_name}}',
    inAppMessage: '"{{message_preview}}"',
    variables: [
      {
        tag: '{{customer_name}}',
        name: 'Customer name',
        description: 'Sender display name',
        example: 'Rafiq Hossain',
      },
      {
        tag: '{{message_preview}}',
        name: 'Message preview',
        description: 'Truncated message text',
        example: 'When will my order ship?',
      },
    ],
  },
];

export const NOTIFICATION_TEMPLATE_KEYS = DEFAULT_NOTIFICATION_TEMPLATES.map(
  (t) => t.key,
) as readonly string[];
