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
  tenantId?: string;
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
  async getCollections(
    tenantId?: string,
  ): Promise<ApiResponse<CollectionResponseData[]>> {
    return await apiClient.get<ApiResponse<CollectionResponseData[]>>(
      '/collections',
      tenantId ? { tenantId } : undefined,
    );
  },

  /**
   * Get a single collection details by ID or Slug
   */
  async getCollectionBySlugOrId(
    idOrSlug: string,
    tenantId?: string,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.get<ApiResponse<CollectionResponseData>>(
      `/collections/${idOrSlug}`,
      tenantId ? { tenantId } : undefined,
    );
  },

  /**
   * Create a new collection in the backend
   */
  async createCollection(
    payload: CreateCollectionPayload,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.post<ApiResponse<CollectionResponseData>>(
      '/collections',
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
      `/collections/${idOrSlug}`,
      payload,
    );
  },

  /**
   * Delete a collection in the backend
   */
  async deleteCollection(
    idOrSlug: string,
    tenantId?: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(
      `/collections/${idOrSlug}`,
      tenantId ? { tenantId } : undefined,
    );
  },
};
