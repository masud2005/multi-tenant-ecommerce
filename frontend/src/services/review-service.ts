import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type {
  Review,
  ReviewStats,
  ReviewStatus,
  ProductReviewsResponse,
  CreateReviewPayload,
  CreateOwnerReviewPayload,
  UpdateOwnerReviewPayload,
  ProductReviewsQuery,
  OwnerReviewsQuery,
} from '@/types/review';

// Mapper to normalize raw backend review to frontend format
export function mapBackendReviewToFrontend(raw: any): Review {
  const photos = Array.isArray(raw.photos)
    ? raw.photos
    : typeof raw.photos === 'string'
    ? [raw.photos]
    : [];

  const createdAt = raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString();

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    productId: raw.productId || raw.product?.id || '',
    customerId: raw.customerId || raw.customer?.id,
    productTitle: raw.product?.title || raw.productTitle || 'Product',
    author: raw.author || raw.customer?.name || 'Customer',
    rating: Number(raw.rating) || 5,
    title: raw.title || '',
    body: raw.body || '',
    date: createdAt,
    createdAt: createdAt,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : createdAt,
    verified: Boolean(raw.verified),
    photos: photos,
    helpful: Number(raw.helpful) || 0,
    helpfulVotedByMe: Boolean(raw.helpfulVotedByMe),
    status: raw.status || 'PUBLISHED',
    size: raw.size || undefined,
    reply: raw.reply || undefined,
    reported: Boolean(raw.reported),
    product: raw.product
      ? {
          id: raw.product.id,
          title: raw.product.title,
          slug: raw.product.slug,
          images: Array.isArray(raw.product.images) ? raw.product.images : [],
          price: Number(raw.product.price) || 0,
          salePrice: raw.product.salePrice ? Number(raw.product.salePrice) : null,
        }
      : undefined,
    customer: raw.customer
      ? {
          id: raw.customer.id,
          name: raw.customer.name,
          email: raw.customer.email,
          phone: raw.customer.phone || null,
        }
      : undefined,
  };
}

export const reviewService = {
  // ----------------------------------------------------
  // Customer Endpoints (/customer/...)
  // ----------------------------------------------------

  // 1. Submit a direct instant review (POST /customer/reviews)
  async createReview(
    payload: CreateReviewPayload,
  ): Promise<ApiResponse<Review>> {
    try {
      const res = await apiClient.post<ApiResponse<any>>('/customer/reviews', payload);
      if (res?.data) {
        return {
          ...res,
          data: mapBackendReviewToFrontend(res.data),
        };
      }
      return res;
    } catch (error: any) {
      console.error('Failed to create customer review:', error);
      throw error;
    }
  },

  // 2. Fetch reviews for a specific product with live stats (GET /customer/products/:productId/reviews)
  async getProductReviews(
    productId: string,
    query: ProductReviewsQuery = {},
  ): Promise<ApiResponse<ProductReviewsResponse>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.rating) params.set('rating', String(query.rating));
    if (query.withPhotosOnly) params.set('withPhotosOnly', 'true');
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const qs = params.toString();
    const endpoint = `/customer/products/${encodeURIComponent(productId)}/reviews${qs ? `?${qs}` : ''}`;

    try {
      const res = await apiClient.get<ApiResponse<any>>(endpoint);
      if (res?.data) {
        const rawReviews = Array.isArray(res.data.reviews) ? res.data.reviews : [];
        return {
          ...res,
          data: {
            reviews: rawReviews.map(mapBackendReviewToFrontend),
            stats: res.data.stats || {
              totalReviews: rawReviews.length,
              averageRating: 5.0,
              distribution: { 5: rawReviews.length, 4: 0, 3: 0, 2: 0, 1: 0 },
              withPhotosCount: 0,
            },
            pagination: res.data.pagination || {
              total: rawReviews.length,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          },
        };
      }
      throw new Error('No data received from reviews API');
    } catch (error: any) {
      console.warn(`[review-service] Failed to fetch product reviews for "${productId}":`, error?.message || error);
      return {
        success: false,
        data: {
          reviews: [],
          stats: {
            totalReviews: 0,
            averageRating: 5.0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            withPhotosCount: 0,
          },
          pagination: {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
        message: error?.message || 'Failed to load reviews',
      };
    }
  },

  // 3. Toggle helpful vote (POST /customer/reviews/:id/helpful)
  async markReviewHelpful(reviewId: string): Promise<
    ApiResponse<{ id: string; helpful: number; helpfulVotedByMe: boolean }>
  > {
    try {
      return await apiClient.post<
        ApiResponse<{ id: string; helpful: number; helpfulVotedByMe: boolean }>
      >(`/customer/reviews/${reviewId}/helpful`);
    } catch (error: any) {
      console.error('Failed to toggle review helpful vote:', error);
      throw error;
    }
  },

  // 3.0 Fetch my reviews + delivered products awaiting review (GET /customer/reviews/me)
  async getMyReviews(): Promise<
    ApiResponse<{
      reviews: Review[];
      reviewableProducts: Array<{
        id: string;
        title: string;
        slug: string;
        images: string[];
        price?: number;
        salePrice?: number | null;
      }>;
    }>
  > {
    try {
      const res = await apiClient.get<ApiResponse<any>>('/customer/reviews/me');
      if (res?.data) {
        const rawReviews = Array.isArray(res.data.reviews) ? res.data.reviews : [];
        const rawProducts = Array.isArray(res.data.reviewableProducts)
          ? res.data.reviewableProducts
          : [];
        return {
          ...res,
          data: {
            reviews: rawReviews.map(mapBackendReviewToFrontend),
            reviewableProducts: rawProducts.map((p: any) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              images: Array.isArray(p.images) ? p.images : [],
              price: Number(p.price) || 0,
              salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            })),
          },
        };
      }
      throw new Error('No data received');
    } catch (error: any) {
      console.warn('[review-service] Failed to fetch my reviews:', error?.message || error);
      throw error;
    }
  },

  // 3.1 Fetch published reviews for store testimonials (GET /customer/reviews)
  async getStoreReviews(
    query: { page?: number; limit?: number; rating?: number } = {},
  ): Promise<ApiResponse<{
    reviews: Review[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.rating) params.set('rating', String(query.rating));

    const qs = params.toString();
    const endpoint = `/customer/reviews${qs ? `?${qs}` : ''}`;

    try {
      const res = await apiClient.get<ApiResponse<any>>(endpoint);
      if (res?.data) {
        const rawReviews = Array.isArray(res.data.reviews) ? res.data.reviews : [];
        return {
          ...res,
          data: {
            reviews: rawReviews.map(mapBackendReviewToFrontend),
            pagination: res.data.pagination || {
              total: rawReviews.length,
              page: 1,
              limit: query.limit || 15,
              totalPages: 1,
            },
          },
        };
      }
      throw new Error('No data received');
    } catch (error: any) {
      console.warn('[review-service] Failed to fetch store reviews:', error?.message || error);
      return {
        success: false,
        data: {
          reviews: [],
          pagination: { total: 0, page: 1, limit: query.limit || 15, totalPages: 1 },
        },
        message: error?.message || 'Failed to load reviews',
      };
    }
  },

  // ----------------------------------------------------
  // Owner Endpoints (/owner/reviews)
  // ----------------------------------------------------

  // 4. Fetch all store reviews with metrics (GET /owner/reviews)
  async getOwnerReviews(
    query: OwnerReviewsQuery = {},
  ): Promise<ApiResponse<{
    reviews: Review[];
    stats: ReviewStats;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.rating) params.set('rating', String(query.rating));
    if (query.productId) params.set('productId', query.productId);
    if (typeof query.hasReply === 'boolean') params.set('hasReply', String(query.hasReply));
    if (query.withPhotosOnly) params.set('withPhotosOnly', 'true');
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);

    const qs = params.toString();
    const endpoint = `/owner/reviews${qs ? `?${qs}` : ''}`;

    try {
      const res = await apiClient.get<ApiResponse<any>>(endpoint);
      if (res?.data) {
        const rawReviews = Array.isArray(res.data.reviews) ? res.data.reviews : [];
        return {
          ...res,
          data: {
            reviews: rawReviews.map(mapBackendReviewToFrontend),
            stats: res.data.stats || {
              totalReviews: rawReviews.length,
              averageRating: 5.0,
              distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              withPhotosCount: 0,
              repliedCount: 0,
              pendingReplyCount: 0,
            },
            pagination: res.data.pagination || {
              total: rawReviews.length,
              page: 1,
              limit: 20,
              totalPages: 1,
            },
          },
        };
      }
      throw new Error('No data received');
    } catch (error: any) {
      console.warn('[review-service] Failed to fetch owner reviews:', error?.message || error);
      return {
        success: false,
        data: {
          reviews: [],
          stats: {
            totalReviews: 0,
            averageRating: 5.0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            withPhotosCount: 0,
            repliedCount: 0,
            pendingReplyCount: 0,
          },
          pagination: {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
        message: error?.message || 'Failed to fetch reviews',
      };
    }
  },

  // 5. Fetch single review by ID (GET /owner/reviews/:id)
  async getOwnerReviewById(id: string): Promise<ApiResponse<Review>> {
    const res = await apiClient.get<ApiResponse<any>>(`/owner/reviews/${id}`);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReviewToFrontend(res.data),
      };
    }
    return res;
  },

  // 6. Post admin reply (POST /owner/reviews/:id/reply)
  async replyToReview(id: string, reply: string): Promise<ApiResponse<Review>> {
    const res = await apiClient.post<ApiResponse<any>>(`/owner/reviews/${id}/reply`, {
      reply,
    });
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReviewToFrontend(res.data),
      };
    }
    return res;
  },

  // 7. Create review manually (POST /owner/reviews)
  async createOwnerReview(
    payload: CreateOwnerReviewPayload,
  ): Promise<ApiResponse<Review>> {
    const res = await apiClient.post<ApiResponse<any>>('/owner/reviews', payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReviewToFrontend(res.data),
      };
    }
    return res;
  },

  // 8. Update review status (PATCH /owner/reviews/:id/status)
  async updateReviewStatus(
    id: string,
    status: ReviewStatus,
  ): Promise<ApiResponse<Review>> {
    const res = await apiClient.patch<ApiResponse<any>>(`/owner/reviews/${id}/status`, {
      status,
    });
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReviewToFrontend(res.data),
      };
    }
    return res;
  },

  // 9. Update review details (PATCH /owner/reviews/:id)
  async updateOwnerReview(
    id: string,
    payload: UpdateOwnerReviewPayload,
  ): Promise<ApiResponse<Review>> {
    const res = await apiClient.patch<ApiResponse<any>>(`/owner/reviews/${id}`, payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReviewToFrontend(res.data),
      };
    }
    return res;
  },

  // 10. Delete review (DELETE /owner/reviews/:id)
  async deleteOwnerReview(id: string): Promise<ApiResponse<{ id: string }>> {
    return apiClient.delete<ApiResponse<{ id: string }>>(`/owner/reviews/${id}`);
  },
};
