// Customer Wishlist Service - Communicates with /wishlist backend endpoints
import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export interface WishlistProductImage {
  id: string;
  url: string;
  alt?: string;
  isCover: boolean;
}

export interface WishlistProductData {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  price: number;
  salePrice: number | null;
  preorder: boolean;
  isNew: boolean;
  isBestseller: boolean;
  rating: number;
  reviewCount: number;
  totalStock: number;
  inStock: boolean;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  images: WishlistProductImage[];
  coverImage: string | null;
  variantsCount: number;
  availableSizes: string[];
  availableColors: string[];
}

export interface WishlistItemResponse {
  wishlistItemId: string;
  savedAt: string;
  product: WishlistProductData;
}

export interface ToggleWishlistResponse {
  wished: boolean;
  productId: string;
  wishlistItemId?: string;
}

export interface QueryWishlistParams {
  tenantId?: string;
  page?: number;
  limit?: number;
}

export const wishlistService = {
  /**
   * Fetch current authenticated user's wishlist items
   */
  async getWishlist(
    params?: QueryWishlistParams,
  ): Promise<ApiResponse<WishlistItemResponse[]>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.tenantId) query.append('tenantId', params.tenantId);

    const queryString = query.toString();
    const endpoint = queryString ? `/wishlist?${queryString}` : '/wishlist';

    return await apiClient.get<ApiResponse<WishlistItemResponse[]>>(endpoint);
  },

  /**
   * Toggle a product in customer's wishlist (Add if not present, delete if present)
   */
  async toggleWishlist(
    productId: string,
    tenantId?: string,
  ): Promise<ApiResponse<ToggleWishlistResponse>> {
    return await apiClient.post<ApiResponse<ToggleWishlistResponse>>('/wishlist/toggle', {
      productId,
      tenantId,
    });
  },

  /**
   * Directly remove a product from customer's wishlist
   */
  async removeFromWishlist(
    productId: string,
    tenantId?: string,
  ): Promise<ApiResponse<null>> {
    const endpoint = tenantId ? `/wishlist/${productId}?tenantId=${tenantId}` : `/wishlist/${productId}`;
    return await apiClient.delete<ApiResponse<null>>(endpoint);
  },

  /**
   * Sync and merge guest wishlist product IDs with user's backend database wishlist upon login
   */
  async syncWishlist(
    productIds: string[],
    tenantId?: string,
  ): Promise<ApiResponse<WishlistItemResponse[]>> {
    return await apiClient.post<ApiResponse<WishlistItemResponse[]>>('/wishlist/sync', {
      productIds,
      tenantId,
    });
  },
};
