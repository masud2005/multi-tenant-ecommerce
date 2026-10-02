import { apiClient, ApiResponse } from './api-client';

export interface CreateBrandPayload {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
  tenantId?: string;
}

export interface BrandResponseData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: {
    products: number;
  };
  products?: any[];
}

export const brandService = {
  /**
   * Get all brands from the backend
   */
  async getBrands(
    tenantId?: string,
  ): Promise<ApiResponse<BrandResponseData[]>> {
    const endpoint = tenantId ? `/brands?tenantId=${tenantId}` : '/brands';
    return await apiClient.get<ApiResponse<BrandResponseData[]>>(endpoint);
  },

  /**
   * Get a single brand details by ID or Slug
   */
  async getBrandBySlugOrId(
    idOrSlug: string,
    tenantId?: string,
  ): Promise<ApiResponse<BrandResponseData>> {
    const endpoint = tenantId
      ? `/brands/${idOrSlug}?tenantId=${tenantId}`
      : `/brands/${idOrSlug}`;
    return await apiClient.get<ApiResponse<BrandResponseData>>(endpoint);
  },

  /**
   * Create a new brand in the backend
   */
  async createBrand(
    payload: CreateBrandPayload,
  ): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.post<ApiResponse<BrandResponseData>>(
      '/brands',
      payload,
    );
  },

  /**
   * Update an existing brand in the backend
   */
  async updateBrand(
    idOrSlug: string,
    payload: Partial<CreateBrandPayload>,
  ): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.patch<ApiResponse<BrandResponseData>>(
      `/brands/${idOrSlug}`,
      payload,
    );
  },

  /**
   * Delete a brand in the backend (soft delete)
   */
  async deleteBrand(
    idOrSlug: string,
    tenantId?: string,
  ): Promise<ApiResponse<null>> {
    const endpoint = tenantId
      ? `/brands/${idOrSlug}?tenantId=${tenantId}`
      : `/brands/${idOrSlug}`;
    return await apiClient.delete<ApiResponse<null>>(endpoint);
  },
};

