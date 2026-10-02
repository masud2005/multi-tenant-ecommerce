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
  tenantId?: string;
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
      '/categories',
      payload,
    );
  },
};
