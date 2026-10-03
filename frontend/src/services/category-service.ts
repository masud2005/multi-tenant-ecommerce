import { apiClient, ApiResponse } from './api-client';

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  isActive?: boolean;
  showInNav?: boolean;
  order?: number;
  parentId?: string;
}

export interface CategoryResponseData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  isActive: boolean;
  showInNav: boolean;
  order: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const categoryService = {
  /**
   * Create a new category or subcategory
   */
  async createCategory(
    payload: CreateCategoryPayload,
  ): Promise<ApiResponse<CategoryResponseData>> {
    return await apiClient.post<ApiResponse<CategoryResponseData>>(
      '/owner/categories',
      payload,
    );
  },

  /**
   * Update an existing category or subcategory
   */
  async updateCategory(
    idOrSlug: string,
    payload: Partial<CreateCategoryPayload>,
  ): Promise<ApiResponse<CategoryResponseData>> {
    return await apiClient.patch<ApiResponse<CategoryResponseData>>(
      `/owner/categories/${idOrSlug}`,
      payload,
    );
  },

  /**
   * Get all categories for tenant
   */
  async getCategories(): Promise<ApiResponse<CategoryResponseData[]>> {
    return await apiClient.get<ApiResponse<CategoryResponseData[]>>('/owner/categories');
  },

  /**
   * Get single category details by ID or Slug
   */
  async getCategoryBySlugOrId(
    idOrSlug: string,
  ): Promise<ApiResponse<CategoryResponseData>> {
    return await apiClient.get<ApiResponse<CategoryResponseData>>(`/owner/categories/${idOrSlug}`);
  },

  /**
   * Delete a category or subcategory
   */
  async deleteCategory(
    idOrSlug: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(`/owner/categories/${idOrSlug}`);
  },
};



