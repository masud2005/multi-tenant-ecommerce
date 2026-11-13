import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  size: string;
  dims?: string;
  dimensions?: string;
  alt: string;
  usedIn: number;
  createdAt?: string;
}

export interface QueryMediaParams {
  filter?: 'all' | 'noalt' | 'unused';
  search?: string;
  page?: number;
  limit?: number;
}

export interface MediaResponseData {
  assets: MediaAsset[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: {
    total: number;
    noAltCount: number;
    unusedCount: number;
    storageUsedFormatted: string;
    storageLimitFormatted: string;
    storagePercent: number;
  };
}

export const mediaService = {
  // List media assets
  async getMedia(params?: QueryMediaParams): Promise<ApiResponse<MediaResponseData>> {
    const searchParams = new URLSearchParams();
    if (params?.filter && params.filter !== 'all') {
      searchParams.set('filter', params.filter);
    }
    if (params?.search?.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params?.page) {
      searchParams.set('page', String(params.page));
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();
    const endpoint = query ? `/owner/media?${query}` : '/owner/media';
    return await apiClient.get<ApiResponse<MediaResponseData>>(endpoint);
  },

  // Upload image file to Cloudinary and register in media library
  async uploadFile(
    file: File,
    options?: { alt?: string },
  ): Promise<ApiResponse<MediaAsset>> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.alt?.trim()) {
      formData.append('alt', options.alt.trim());
    }
    return await apiClient.post<ApiResponse<MediaAsset>>(
      '/owner/media/upload',
      formData,
    );
  },

  // Save new media asset record
  async createMedia(dto: {
    name: string;
    url: string;
    size?: string;
    dimensions?: string;
    alt?: string;
  }): Promise<ApiResponse<MediaAsset>> {
    return await apiClient.post<ApiResponse<MediaAsset>>('/owner/media', dto);
  },

  // Update alt text or name
  async updateMedia(
    id: string,
    dto: { alt?: string; name?: string },
  ): Promise<ApiResponse<MediaAsset>> {
    return await apiClient.patch<ApiResponse<MediaAsset>>(`/owner/media/${encodeURIComponent(id)}`, dto);
  },

  // Delete media asset
  async deleteMedia(id: string): Promise<ApiResponse<{ id?: string }>> {
    return await apiClient.delete<ApiResponse<{ id?: string }>>(`/owner/media/${encodeURIComponent(id)}`);
  },
};

