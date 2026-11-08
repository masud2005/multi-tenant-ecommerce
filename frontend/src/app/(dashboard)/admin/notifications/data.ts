export interface TemplateVariable {
  tag: string;
  name: string;
  description: string;
  example: string;
}

export type NotificationChannel = 'email' | 'inApp';

export type NotificationTemplateGroup =
  | 'Orders'
  | 'Shipping'
  | 'Inventory'
  | 'Returns'
  | 'Reviews'
  | 'Support';

export interface NotificationTemplate {
  id: string;
  key: string;
  event: string;
  group: NotificationTemplateGroup | string;
  description: string;
  email: boolean;
  inApp: boolean;
  emailSubject: string;
  emailBody: string;
  inAppTitle: string;
  inAppMessage: string;
  variables: TemplateVariable[];
  updatedAt?: string;
}
