// Customer Cart Service - Communicates with /cart endpoints
import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export interface CartItemProductData {
  id: string;
  title: string;
  slug: string;
  price: string | number;
  salePrice?: string | number | null;
  preorder?: boolean;
  images: { url: string; alt?: string }[];
}

export interface CartItemVariantData {
  id: string;
  sku: string;
  color: string;
  colorHex?: string;
  size: string;
  price: string | number;
  salePrice?: string | number | null;
  stock: number;
  reserved: number;
  enabled: boolean;
}

export interface BackendCartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  qty: number;
  savedForLater: boolean;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  isOutOfStock: boolean;
  isLimitedStock: boolean;
  product: CartItemProductData;
  variant: CartItemVariantData;
  createdAt: string;
  updatedAt: string;
}

export interface BackendCartResponse {
  id: string;
  tenantId: string;
  customerId: string | null;
  sessionToken: string;
  subtotal: number;
  totalItemsCount: number;
  items: BackendCartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  productId: string;
  variantId: string;
  qty?: number;
  sessionToken?: string;
  tenantId?: string;
}

export const GUEST_SESSION_KEY = 'tanti_guest_session_token';

export function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return 'guest_default';
  let token = localStorage.getItem(GUEST_SESSION_KEY);
  if (!token) {
    token = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem(GUEST_SESSION_KEY, token);
  }
  return token;
}

export const cartService = {
  /**
   * Get current cart
   */
  async getCart(sessionToken?: string): Promise<ApiResponse<BackendCartResponse>> {
    const token = sessionToken || getOrCreateSessionToken();
    return await apiClient.get<ApiResponse<BackendCartResponse>>('/cart', {
      'x-session-token': token,
    });
  },

  /**
   * Add item to cart and persist in database
   */
  async addToCart(
    payload: AddToCartPayload,
  ): Promise<ApiResponse<BackendCartResponse>> {
    const sessionToken = payload.sessionToken || getOrCreateSessionToken();
    return await apiClient.post<ApiResponse<BackendCartResponse>>(
      '/cart/items',
      {
        ...payload,
        sessionToken,
      },
      {
        'x-session-token': sessionToken,
      },
    );
  },

  /**
   * Update item quantity or savedForLater status
   */
  async updateQuantity(
    itemIdOrVariantId: string,
    qty?: number,
    savedForLater?: boolean,
  ): Promise<ApiResponse<BackendCartResponse>> {
    const sessionToken = getOrCreateSessionToken();
    return await apiClient.patch<ApiResponse<BackendCartResponse>>(
      `/cart/items/${itemIdOrVariantId}`,
      {
        qty,
        savedForLater,
        sessionToken,
      },
      {
        'x-session-token': sessionToken,
      },
    );
  },

  /**
   * Remove item completely from cart
   */
  async removeItem(
    itemIdOrVariantId: string,
  ): Promise<ApiResponse<BackendCartResponse>> {
    const sessionToken = getOrCreateSessionToken();
    return await apiClient.delete<ApiResponse<BackendCartResponse>>(
      `/cart/items/${itemIdOrVariantId}`,
      {
        'x-session-token': sessionToken,
      },
    );
  },
};
