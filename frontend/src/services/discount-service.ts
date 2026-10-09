// Discount and coupon service communicating with owner and storefront discount endpoints
import { apiClient } from './api-client';
import type {
  ApiResponse,
  PaginatedResponse,
  DiscountResponseData,
  CreateDiscountPayload,
  UpdateDiscountPayload,
  DiscountQueryParams,
  ApplyDiscountPayload,
  ApplyDiscountResult,
} from '@/types';

export type {
  DiscountResponseData,
  CreateDiscountPayload,
  UpdateDiscountPayload,
  DiscountQueryParams,
  ApplyDiscountPayload,
  ApplyDiscountResult,
};

export const discountService = {
  // 1. Owner: Get all discounts with pagination and filters
  async getDiscounts(
    params?: DiscountQueryParams,
  ): Promise<PaginatedResponse<DiscountResponseData>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const endpoint = `/owner/discounts${queryString ? `?${queryString}` : ''}`;

    return await apiClient.get<PaginatedResponse<DiscountResponseData>>(endpoint);
  },

  // 2. Owner: Get single discount details and redemptions by ID or Code
  async getDiscountByIdOrCode(
    idOrCode: string,
  ): Promise<ApiResponse<DiscountResponseData>> {
    return await apiClient.get<ApiResponse<DiscountResponseData>>(
      `/owner/discounts/${encodeURIComponent(idOrCode)}`,
    );
  },

  // 3. Owner: Create new discount campaign
  async createDiscount(
    payload: CreateDiscountPayload,
  ): Promise<ApiResponse<DiscountResponseData>> {
    return await apiClient.post<ApiResponse<DiscountResponseData>>(
      '/owner/discounts',
      payload,
    );
  },

  // 4. Owner: Update existing discount
  async updateDiscount(
    id: string,
    payload: UpdateDiscountPayload,
  ): Promise<ApiResponse<DiscountResponseData>> {
    return await apiClient.patch<ApiResponse<DiscountResponseData>>(
      `/owner/discounts/${id}`,
      payload,
    );
  },

  // 5. Owner: Soft delete discount
  async deleteDiscount(id: string): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(`/owner/discounts/${id}`);
  },

  // 6. Storefront: Apply discount coupon in cart/checkout
  async applyDiscount(
    payload: ApplyDiscountPayload,
  ): Promise<ApiResponse<ApplyDiscountResult>> {
    return await apiClient.post<ApiResponse<ApplyDiscountResult>>(
      '/discounts/apply',
      payload,
    );
  },
};
