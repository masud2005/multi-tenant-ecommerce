export interface TemplateVariable {
  tag: string;
  name: string;
  description: string;
  example: string;
}

export type NotificationChannel = 'email' | 'push';

export interface NotificationTemplate {
  id: string;
  event: string;
  group: 'Orders' | 'Payments' | 'Shipping' | 'Returns' | 'Account';
  description: string;
  email: boolean;
  push: boolean;
  emailSubject: string;
  emailBody: string;
  pushTitle: string;
  pushBody: string;
  variables: TemplateVariable[];
}

export const samplePreviewData: Record<string, string> = {
  '{{customer_name}}': 'Tanvir Ahmed',
  '{{order_number}}': '#ORD-8492',
  '{{order_date}}': 'Oct 9, 2026',
  '{{total_amount}}': '৳3,450',
  '{{items_summary}}': '2 items (Silk Panjabi, Leather Loafer)',
  '{{shipping_address}}': 'House 14, Road 7, Dhanmondi, Dhaka',
  '{{tracking_url}}': 'https://track.tanti.com.bd/8492',
  '{{courier_name}}': 'Pathao Courier',
  '{{payment_method}}': 'bKash',
  '{{transaction_id}}': 'TRX-948102',
  '{{retry_payment_url}}': 'https://tanti.com.bd/checkout/retry',
  '{{return_id}}': '#RET-104',
  '{{refund_amount}}': '৳1,850',
  '{{refund_method}}': 'bKash Wallet',
  '{{customer_phone}}': '01712-345678',
  '{{customer_email}}': 'tanvir.a@outlook.com',
  '{{otp_code}}': '592814',
  '{{expiry_minutes}}': '5',
  '{{expiry_hours}}': '24',
  '{{reset_link}}': 'https://tanti.com.bd/reset-password?token=a8f9c1',
  '{{login_url}}': 'https://tanti.com.bd/login',
  '{{review_url}}': 'https://tanti.com.bd/orders/8492/review',
  '{{delivery_date}}': 'Today, 2:30 PM',
  '{{cancellation_reason}}': 'Customer request',
  '{{return_instructions}}': 'Please hand over the parcel in original packaging.',
  '{{store_name}}': 'Tanti Fashion',
  '{{support_email}}': 'support@tanti.com.bd'
};

const commonOrderVars: TemplateVariable[] = [
  { tag: '{{customer_name}}', name: 'Customer name', description: 'Full name of customer', example: 'Tanvir Ahmed' },
  { tag: '{{order_number}}', name: 'Order number', description: 'Unique order identifier', example: '#ORD-8492' },
  { tag: '{{total_amount}}', name: 'Total amount', description: 'Total order value with currency', example: '৳3,450' },
  { tag: '{{items_summary}}', name: 'Items summary', description: 'List or summary of purchased items', example: '2 items' },
  { tag: '{{shipping_address}}', name: 'Shipping address', description: 'Customer destination address', example: 'Dhanmondi, Dhaka' },
  { tag: '{{tracking_url}}', name: 'Tracking URL', description: 'Live tracking link for shipment', example: 'https://track.tanti.com.bd/8492' },
  { tag: '{{store_name}}', name: 'Store name', description: 'Your active brand name', example: 'Tanti Fashion' },
  { tag: '{{support_email}}', name: 'Support email', description: 'Store customer care email', example: 'support@tanti.com.bd' }
];

export const initialNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'n1',
    event: 'Order confirmation',
    group: 'Orders',
    description: 'Triggered when a customer successfully completes checkout.',
    email: true,
    push: false,
    emailSubject: 'Order Confirmed: {{order_number}} — {{store_name}}',
    emailBody: `Hi {{customer_name}},

Thank you for your order! We have received order {{order_number}} totaling {{total_amount}} and are currently preparing it for dispatch.

Items in your order:
{{items_summary}}

Shipping to:
{{shipping_address}}

You can monitor your order progress anytime:
{{tracking_url}}

If you have any questions, reply to this email or contact {{support_email}}.

Warm regards,
{{store_name}} Team`,
    pushTitle: 'Order {{order_number}} Confirmed! 🛍️',
    pushBody: 'Hi {{customer_name}}, we received your order for {{total_amount}}. We are packing it now!',
    variables: commonOrderVars
  },
  {
    id: 'n2',
    event: 'Payment received',
    group: 'Payments',
    description: 'Triggered when an online payment gateway confirms successful transaction.',
    email: true,
    push: false,
    emailSubject: 'Payment Successful for {{order_number}} — {{store_name}}',
    emailBody: `Hi {{customer_name}},

We have successfully received your payment of {{total_amount}} for order {{order_number}} via {{payment_method}}.

Transaction ID: {{transaction_id}}

Your invoice is ready and your order is moving forward to fulfillment.

Thank you for choosing {{store_name}}!`,
    pushTitle: 'Payment Received: {{total_amount}} 💳',
    pushBody: 'Payment for order {{order_number}} was successfully confirmed via {{payment_method}}.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{total_amount}}', name: 'Total amount', description: 'Paid order amount', example: '৳3,450' },
      { tag: '{{payment_method}}', name: 'Payment method', description: 'Payment gateway or channel', example: 'bKash' },
      { tag: '{{transaction_id}}', name: 'Transaction ID', description: 'Gateway transaction reference', example: 'TRX-948102' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n3',
    event: 'Payment failed',
    group: 'Payments',
    description: 'Triggered when payment authorization fails or customer cancels checkout.',
    email: true,
    push: true,
    emailSubject: 'Payment Failed for Order {{order_number}} — Action Required',
    emailBody: `Hi {{customer_name}},

We could not complete your payment of {{total_amount}} for order {{order_number}}.

Don't worry, your items have been reserved temporarily. You can retry paying with another method using this secure link:
{{retry_payment_url}}

If money was deducted from your account, please reply with your {{transaction_id}} and we will investigate right away.

{{store_name}} Support`,
    pushTitle: 'Payment Could Not Be Processed ⚠️',
    pushBody: 'Payment failed for order {{order_number}}. Tap here to retry or use a different payment method.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order reference', example: '#ORD-8492' },
      { tag: '{{total_amount}}', name: 'Total amount', description: 'Order total', example: '৳3,450' },
      { tag: '{{retry_payment_url}}', name: 'Retry link', description: 'Instant checkout payment recovery link', example: 'https://tanti.com.bd/retry' },
      { tag: '{{support_email}}', name: 'Support email', description: 'Support help desk email', example: 'support@tanti.com.bd' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n4',
    event: 'Order shipped',
    group: 'Shipping',
    description: 'Triggered when package is dispatched with the assigned courier partner.',
    email: true,
    push: true,
    emailSubject: 'Your order {{order_number}} has shipped! 🚚',
    emailBody: `Hi {{customer_name}},

Exciting news! Your order {{order_number}} has been dispatched via {{courier_name}}.

Track your package in real-time:
{{tracking_url}}

Destination:
{{shipping_address}}

Estimated delivery is within 24-48 hours.

Warm regards,
{{store_name}}`,
    pushTitle: 'Order {{order_number}} Dispatched 🚚',
    pushBody: 'Your parcel is on its way via {{courier_name}}. Tap to track live shipment status.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{courier_name}}', name: 'Courier service', description: 'Assigned logistics partner', example: 'Pathao Courier' },
      { tag: '{{tracking_url}}', name: 'Tracking link', description: 'Live tracking URL', example: 'https://track.tanti.com.bd/8492' },
      { tag: '{{shipping_address}}', name: 'Shipping address', description: 'Customer address', example: 'Dhanmondi, Dhaka' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n5',
    event: 'Out for delivery',
    group: 'Shipping',
    description: 'Triggered on the day the delivery rider attempts delivery.',
    email: false,
    push: true,
    emailSubject: 'Out for Delivery: Order {{order_number}} arrives today!',
    emailBody: `Hi {{customer_name}},

Your parcel for order {{order_number}} is out for delivery today with {{courier_name}}.

Please keep your phone active at {{shipping_address}}.

Track delivery progress:
{{tracking_url}}

— {{store_name}}`,
    pushTitle: 'Out For Delivery Today! 📦',
    pushBody: 'Your rider is delivering order {{order_number}} today. Please keep your phone reachable!',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{courier_name}}', name: 'Courier service', description: 'Logistics partner', example: 'Pathao Courier' },
      { tag: '{{tracking_url}}', name: 'Tracking link', description: 'Real-time tracking link', example: 'https://track.tanti.com.bd/8492' },
      { tag: '{{shipping_address}}', name: 'Shipping address', description: 'Destination address', example: 'Dhanmondi, Dhaka' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n6',
    event: 'Order delivered',
    group: 'Shipping',
    description: 'Triggered when the courier confirms parcel delivery to the customer.',
    email: true,
    push: false,
    emailSubject: 'Delivered: Order {{order_number}} — Enjoy your items! 🎉',
    emailBody: `Hi {{customer_name}},

Your order {{order_number}} was successfully delivered at {{delivery_date}}.

We hope you love your new purchase! How was your experience? Leave a review and let us know:
{{review_url}}

Thank you for shopping with {{store_name}}!`,
    pushTitle: 'Order Delivered! 🎉',
    pushBody: 'Order {{order_number}} has been delivered. We hope you love it! Tap to rate your experience.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{delivery_date}}', name: 'Delivery timestamp', description: 'Time when package was marked delivered', example: 'Today, 2:30 PM' },
      { tag: '{{review_url}}', name: 'Review link', description: 'Product review feedback URL', example: 'https://tanti.com.bd/review' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n7',
    event: 'Order cancelled',
    group: 'Orders',
    description: 'Triggered when an order is cancelled by the merchant or customer.',
    email: true,
    push: false,
    emailSubject: 'Order {{order_number}} Cancelled — {{store_name}}',
    emailBody: `Hi {{customer_name}},

Your order {{order_number}} has been cancelled.

Reason: {{cancellation_reason}}

If you have already paid, a full refund of {{total_amount}} will be processed to your original payment account.

For questions or assistance, contact {{support_email}}.

— {{store_name}} Support`,
    pushTitle: 'Order {{order_number}} Cancelled',
    pushBody: 'Your order {{order_number}} was cancelled. Tap to view details or speak with customer care.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{total_amount}}', name: 'Total amount', description: 'Order total refunded', example: '৳3,450' },
      { tag: '{{cancellation_reason}}', name: 'Cancellation reason', description: 'Reason for cancellation', example: 'Customer request' },
      { tag: '{{support_email}}', name: 'Support email', description: 'Support help desk email', example: 'support@tanti.com.bd' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n8',
    event: 'Return approved',
    group: 'Returns',
    description: 'Triggered when merchant accepts a return request.',
    email: true,
    push: false,
    emailSubject: 'Return Request Approved for {{order_number}}',
    emailBody: `Hi {{customer_name}},

Good news! Your return request {{return_id}} for order {{order_number}} has been approved.

Instructions:
{{return_instructions}}

Once our team receives and inspects the item, your refund will be credited immediately.

Warmly,
{{store_name}} Returns`,
    pushTitle: 'Return Approved: {{return_id}} ✅',
    pushBody: 'Your return for order {{order_number}} was approved. Tap to view pickup instructions.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{return_id}}', name: 'Return ID', description: 'Return request reference code', example: '#RET-104' },
      { tag: '{{return_instructions}}', name: 'Return instructions', description: 'Packaging and pickup instructions', example: 'Pack in original box' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n9',
    event: 'Refund issued',
    group: 'Returns',
    description: 'Triggered when a refund payment is processed for returned or cancelled items.',
    email: true,
    push: false,
    emailSubject: 'Refund Issued for Order {{order_number}} — {{refund_amount}}',
    emailBody: `Hi {{customer_name}},

We have processed a refund of {{refund_amount}} for order {{order_number}} to your {{refund_method}}.

Transaction Reference: {{transaction_id}}

Depending on your bank or wallet provider, funds typically reflect within 1-3 business days.

Thank you for your patience!

Best regards,
{{store_name}} Finance`,
    pushTitle: 'Refund Processed: {{refund_amount}} 💰',
    pushBody: 'A refund of {{refund_amount}} for order {{order_number}} has been sent to your {{refund_method}}.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{order_number}}', name: 'Order number', description: 'Order ID', example: '#ORD-8492' },
      { tag: '{{refund_amount}}', name: 'Refund amount', description: 'Total refunded amount', example: '৳1,850' },
      { tag: '{{refund_method}}', name: 'Refund method', description: 'Bank or mobile wallet method', example: 'bKash Wallet' },
      { tag: '{{transaction_id}}', name: 'Transaction ID', description: 'Refund gateway transaction ID', example: 'TRX-948102' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n10',
    event: 'OTP verification',
    group: 'Account',
    description: 'Triggered when customer requests a login or phone/email verification OTP.',
    email: false,
    push: false,
    emailSubject: 'Your Verification Code: {{otp_code}} — {{store_name}}',
    emailBody: `Hi {{customer_name}},

Your one-time verification code is:

{{otp_code}}

This code is valid for {{expiry_minutes}} minutes. For your security, never share this OTP with anyone, including {{store_name}} staff.

— {{store_name}} Security`,
    pushTitle: 'Your OTP Code: {{otp_code}} 🔐',
    pushBody: 'Use code {{otp_code}} to verify your account. Valid for {{expiry_minutes}} minutes. Do not share.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{otp_code}}', name: 'OTP Code', description: '6-digit one-time passcode', example: '592814' },
      { tag: '{{expiry_minutes}}', name: 'Expiry minutes', description: 'Validity duration in minutes', example: '5' },
      { tag: '{{customer_phone}}', name: 'Customer phone', description: 'Registered phone number', example: '01712-345678' },
      { tag: '{{customer_email}}', name: 'Customer email', description: 'Registered email address', example: 'tanvir.a@outlook.com' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Your store name', example: 'Tanti Fashion' }
    ]
  },
  {
    id: 'n11',
    event: 'Password reset',
    group: 'Account',
    description: 'Triggered when a customer requests an OTP code to reset their account password.',
    email: true,
    push: false,
    emailSubject: 'Password Reset OTP: {{otp_code}} — {{store_name}}',
    emailBody: `Hi {{customer_name}},

We received a request to reset the password for your account ({{customer_email}}).

Your password reset OTP code is:

{{otp_code}}

This code is valid for {{expiry_minutes}} minutes. Enter this code on the password reset screen to set your new password.

If you did not request a password reset, you can safely ignore this email.

— {{store_name}} Security`,
    pushTitle: 'Password Reset OTP: {{otp_code}} 🔒',
    pushBody: 'Your password reset OTP is {{otp_code}}. Valid for {{expiry_minutes}} minutes. Do not share this code.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{otp_code}}', name: 'OTP Code', description: '6-digit password reset OTP code', example: '749201' },
      { tag: '{{expiry_minutes}}', name: 'Expiry minutes', description: 'Validity duration in minutes', example: '10' },
      { tag: '{{customer_email}}', name: 'Customer email', description: 'Account email address', example: 'tanvir.a@outlook.com' },
      { tag: '{{customer_phone}}', name: 'Customer phone', description: 'Account phone number', example: '01712-345678' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Your store name', example: 'Tanti Fashion' },
      { tag: '{{support_email}}', name: 'Support email', description: 'Store support email', example: 'support@tanti.com.bd' }
    ]
  },
  {
    id: 'n12',
    event: 'Welcome / registration',
    group: 'Account',
    description: 'Triggered when a new customer registers an account on your store.',
    email: true,
    push: false,
    emailSubject: 'Welcome to {{store_name}}, {{customer_name}}! 🎉',
    emailBody: `Hi {{customer_name}},

Welcome aboard! We are thrilled to have you join {{store_name}}.

Your account is active and ready. Explore the newest arrivals and exclusive member promotions:
{{login_url}}

If you ever need help, feel free to contact us at {{support_email}}.

Happy shopping,
The {{store_name}} Team`,
    pushTitle: 'Welcome to {{store_name}}! 🎉',
    pushBody: 'Hi {{customer_name}}, welcome to our community! Discover the latest curated collections now.',
    variables: [
      { tag: '{{customer_name}}', name: 'Customer name', description: 'Full customer name', example: 'Tanvir Ahmed' },
      { tag: '{{customer_email}}', name: 'Customer email', description: 'Account email address', example: 'tanvir.a@outlook.com' },
      { tag: '{{login_url}}', name: 'Store login URL', description: 'Direct link to customer dashboard', example: 'https://tanti.com.bd/login' },
      { tag: '{{support_email}}', name: 'Support email', description: 'Customer care email', example: 'support@tanti.com.bd' },
      { tag: '{{store_name}}', name: 'Store name', description: 'Store name', example: 'Tanti Fashion' }
    ]
  }
];

export interface DeliveryLogItem {
  id: string;
  at: string;
  channel: 'Email' | 'Push';
  to: string;
  event: string;
  status: 'delivered' | 'opened' | 'failed';
}

export const initialDeliveryLogs: DeliveryLogItem[] = [
  { id: 'nl1', at: '2026-10-09T08:58:00', channel: 'Email', to: 'tanvir.a@outlook.com', event: 'Order shipped', status: 'opened' },
  { id: 'nl2', at: '2026-10-09T08:40:00', channel: 'Email', to: 'rafiq.h@gmail.com', event: 'Payment failed', status: 'delivered' },
  { id: 'nl3', at: '2026-10-08T20:15:00', channel: 'Push', to: 'Web · Chrome (Win)', event: 'Out for delivery', status: 'delivered' },
  { id: 'nl4', at: '2026-10-08T16:30:00', channel: 'Email', to: 'nabil.k@yahoo.com', event: 'Order confirmation', status: 'opened' },
  { id: 'nl5', at: '2026-10-08T14:10:00', channel: 'Push', to: 'Android App · Galaxy S24', event: 'Order shipped', status: 'delivered' },
  { id: 'nl6', at: '2026-10-08T11:05:00', channel: 'Push', to: 'iOS App · iPhone 16 Pro', event: 'Order delivered', status: 'delivered' },
  { id: 'nl7', at: '2026-10-07T19:22:00', channel: 'Email', to: 'sadia.m@gmail.com', event: 'Password reset', status: 'delivered' },
  { id: 'nl8', at: '2026-10-07T15:45:00', channel: 'Email', to: 'zayan.b@gmail.com', event: 'Payment failed', status: 'failed' }
];
