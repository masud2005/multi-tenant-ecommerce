// Brand management service communicating with owner brand endpoints
import { apiClient } from './api-client';
import type {
  ApiResponse,
  BrandResponseData,
  CreateBrandPayload,
  UpdateBrandPayload,
} from '@/types';

export type { BrandResponseData, CreateBrandPayload, UpdateBrandPayload };

export const brandService = {
  // Get all brands
  async getBrands(): Promise<ApiResponse<BrandResponseData[]>> {
    return await apiClient.get<ApiResponse<BrandResponseData[]>>('/owner/brands');
  },

  // Get single brand details
  async getBrandBySlugOrId(idOrSlug: string): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.get<ApiResponse<BrandResponseData>>(`/owner/brands/${idOrSlug}`);
  },

  // Create brand (multipart form data or JSON)
  async createBrand(payload: CreateBrandPayload | FormData): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.post<ApiResponse<BrandResponseData>>('/owner/brands', payload);
  },

  // Update existing brand
  async updateBrand(
    idOrSlug: string,
    payload: UpdateBrandPayload | FormData,
  ): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.patch<ApiResponse<BrandResponseData>>(`/owner/brands/${idOrSlug}`, payload);
  },

  // Soft delete brand
  async deleteBrand(idOrSlug: string): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(`/owner/brands/${idOrSlug}`);
  },
};
