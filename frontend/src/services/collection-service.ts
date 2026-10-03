import { apiClient, ApiResponse } from './api-client';

export interface CreateCollectionPayload {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  type?: 'MANUAL' | 'RULE';
  rule?: any;
  isActive?: boolean;
  isFeatured?: boolean;
  order?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface CollectionResponseData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  type: 'MANUAL' | 'RULE';
  rule: any;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  products?: any[];
}

export const collectionService = {
  /**
   * Get all collections from the backend
   */
  async getCollections(): Promise<ApiResponse<CollectionResponseData[]>> {
    return await apiClient.get<ApiResponse<CollectionResponseData[]>>(
      '/owner/collections',
    );
  },

  /**
   * Get a single collection details by ID or Slug
   */
  async getCollectionBySlugOrId(
    idOrSlug: string,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.get<ApiResponse<CollectionResponseData>>(
      `/owner/collections/${idOrSlug}`,
    );
  },

  /**
   * Create a new collection in the backend
   */
  async createCollection(
    payload: CreateCollectionPayload,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.post<ApiResponse<CollectionResponseData>>(
      '/owner/collections',
      payload,
    );
  },

  /**
   * Update an existing collection in the backend
   */
  async updateCollection(
    idOrSlug: string,
    payload: Partial<CreateCollectionPayload>,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.patch<ApiResponse<CollectionResponseData>>(
      `/owner/collections/${idOrSlug}`,
      payload,
    );
  },

  /**
   * Delete a collection in the backend
   */
  async deleteCollection(
    idOrSlug: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(
      `/owner/collections/${idOrSlug}`,
    );
  },
};
