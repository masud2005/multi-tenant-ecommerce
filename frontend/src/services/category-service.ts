// Category management service communicating with owner category endpoints
import { apiClient } from './api-client';
import type {
  ApiResponse,
  CategoryResponseData,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types';

export type { CategoryResponseData, CreateCategoryPayload, UpdateCategoryPayload };

export const categoryService = {
  // Create a new category or subcategory
  async createCategory(
    payload: CreateCategoryPayload | FormData,
  ): Promise<ApiResponse<CategoryResponseData>> {
    return await apiClient.post<ApiResponse<CategoryResponseData>>(
      '/owner/categories',
      payload,
    );
  },

  // Update an existing category
  async updateCategory(
    idOrSlug: string,
    payload: UpdateCategoryPayload | FormData,
  ): Promise<ApiResponse<CategoryResponseData>> {
    return await apiClient.patch<ApiResponse<CategoryResponseData>>(
      `/owner/categories/${idOrSlug}`,
      payload,
    );
  },

  // Get all categories for tenant
  async getCategories(): Promise<ApiResponse<CategoryResponseData[]>> {
    return await apiClient.get<ApiResponse<CategoryResponseData[]>>('/owner/categories');
  },

  // Get single category details
  async getCategoryBySlugOrId(
    idOrSlug: string,
  ): Promise<ApiResponse<CategoryResponseData>> {
    return await apiClient.get<ApiResponse<CategoryResponseData>>(`/owner/categories/${idOrSlug}`);
  },

  // Delete a category
  async deleteCategory(
    idOrSlug: string,
  ): Promise<ApiResponse<null>> {
    return await apiClient.delete<ApiResponse<null>>(`/owner/categories/${idOrSlug}`);
  },
};
