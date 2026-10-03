// Collection management service communicating with owner collection endpoints
import { apiClient } from './api-client';
import type {
  ApiResponse,
  CollectionResponseData,
  CreateCollectionPayload,
  UpdateCollectionPayload,
} from '@/types';

export type { CollectionResponseData, CreateCollectionPayload, UpdateCollectionPayload };

export const collectionService = {
  // Get all collections
  async getCollections(): Promise<ApiResponse<CollectionResponseData[]>> {
    return await apiClient.get<ApiResponse<CollectionResponseData[]>>(
      '/owner/collections',
    );
  },

  // Get single collection details
  async getCollectionBySlugOrId(
    idOrSlug: string,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.get<ApiResponse<CollectionResponseData>>(
      `/owner/collections/${idOrSlug}`,
    );
  },

  // Create new collection
  async createCollection(
    payload: CreateCollectionPayload | FormData,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.post<ApiResponse<CollectionResponseData>>(
      '/owner/collections',
      payload,
    );
  },

  // Update existing collection
  async updateCollection(
    idOrSlug: string,
    payload: UpdateCollectionPayload | FormData,
  ): Promise<ApiResponse<CollectionResponseData>> {
    return await apiClient.patch<ApiResponse<CollectionResponseData>>(
      `/owner/collections/${idOrSlug}`,
      payload,
    );
  },

  // Delete a collection
  async deleteCollection(
    idOrSlug: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(
      `/owner/collections/${idOrSlug}`,
    );
  },
};
