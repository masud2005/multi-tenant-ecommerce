import { apiClient, ApiResponse } from './api-client';

export interface CreateBrandPayload {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
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
  async getBrands(): Promise<ApiResponse<BrandResponseData[]>> {
    return await apiClient.get<ApiResponse<BrandResponseData[]>>('/owner/brands');
  },

  /**
   * Get a single brand details by ID or Slug
   */
  async getBrandBySlugOrId(
    idOrSlug: string,
  ): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.get<ApiResponse<BrandResponseData>>(`/owner/brands/${idOrSlug}`);
  },

  /**
   * Create a new brand in the backend
   */
  async createBrand(
    payload: CreateBrandPayload,
  ): Promise<ApiResponse<BrandResponseData>> {
    return await apiClient.post<ApiResponse<BrandResponseData>>(
      '/owner/brands',
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
      `/owner/brands/${idOrSlug}`,
      payload,
    );
  },

  /**
   * Delete a brand in the backend (soft delete)
   */
  async deleteBrand(
    idOrSlug: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(`/owner/brands/${idOrSlug}`);
  },
};

