export type ReviewStatus =
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'REJECTED'
  | 'published'
  | 'pending'
  | 'hidden'
  | 'rejected';

export interface ReviewProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price?: number;
  salePrice?: number | null;
}

export interface ReviewCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface Review {
  id: string;
  tenantId?: string;
  productId: string;
  customerId?: string | null;
  productTitle?: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  verified: boolean;
  photos: string[];
  helpful: number;
  status: ReviewStatus;
  size?: string | null;
  reply?: string | null;
  reported?: boolean;
  product?: ReviewProduct;
  customer?: ReviewCustomer;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    [key: number]: number;
  };
  withPhotosCount: number;
  repliedCount?: number;
  pendingReplyCount?: number;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title: string;
  body: string;
  author?: string;
  photos?: string[];
  size?: string;
  orderId?: string;
}

export interface ProductReviewsQuery {
  page?: number;
  limit?: number;
  rating?: number;
  withPhotosOnly?: boolean;
  sortBy?: 'createdAt' | 'rating' | 'helpful';
  sortOrder?: 'desc' | 'asc';
}

export interface OwnerReviewsQuery {
  page?: number;
  limit?: number;
  rating?: number;
  productId?: string;
  hasReply?: boolean;
  withPhotosOnly?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'rating' | 'helpful';
  sortOrder?: 'desc' | 'asc';
}
