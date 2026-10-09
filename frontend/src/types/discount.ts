// Discount & Coupon domain model and API request/response contracts

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
export type DiscountMethod = 'CODE' | 'AUTOMATIC';
export type DiscountStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

export interface DiscountRedemptionItem {
  id: string;
  tenantId: string;
  discountId: string;
  orderId?: string | null;
  userId?: string | null;
  customerEmail?: string | null;
  discountAmount: number;
  createdAt: string;
}

export interface DiscountResponseData {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  type: DiscountType;
  method: DiscountMethod;
  status: DiscountStatus;
  value: number;
  minSubtotal?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerUser: number;
  startsAt: string;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  redemptions?: DiscountRedemptionItem[];
  _count?: {
    redemptions: number;
  };
}

export interface CreateDiscountPayload {
  code: string;
  title: string;
  type: DiscountType;
  method?: DiscountMethod;
  status?: DiscountStatus;
  value: number;
  minSubtotal?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt: string;
  endsAt?: string;
}

export interface UpdateDiscountPayload {
  code?: string;
  title?: string;
  type?: DiscountType;
  method?: DiscountMethod;
  status?: DiscountStatus;
  value?: number;
  minSubtotal?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface DiscountQueryParams {
  search?: string;
  status?: DiscountStatus;
  type?: DiscountType;
  page?: number;
  limit?: number;
}

export interface ApplyDiscountPayload {
  code: string;
  subtotal: number;
  customerEmail?: string;
}

export interface ApplyDiscountResult {
  discountId: string;
  code: string;
  title: string;
  type: DiscountType;
  value: number;
  discountAmount: number;
  originalSubtotal: number;
  newSubtotal: number;
  isFreeShipping: boolean;
}
