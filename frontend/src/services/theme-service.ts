import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type { TenantTheme, ThemeSection } from '@/types/theme';

export interface ThemeCollectionResponse {
  themes?: TenantTheme[];
  liveTheme: TenantTheme;
}

export interface ReorderSectionsPayload {
  sections: Array<{
    id: string;
    orderIndex: number;
    isVisible?: boolean;
  }>;
}

export interface UpdateThemePayload {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  canvasColor?: string;
  surfaceColor?: string;
  inkColor?: string;
  fontHeading?: string;
  fontBody?: string;
  borderRadius?: string;
  cardStyle?: string;
  customCss?: string;
}

export interface PublishThemePayload {
  label?: string;
}

export const themeService = {
  // Get all theme collection (active liveTheme + all themes list)
  async getThemeData(): Promise<ApiResponse<ThemeCollectionResponse>> {
    return await apiClient.get<ApiResponse<ThemeCollectionResponse>>('/owner/theme');
  },

  // Get active live theme for storefront (public, no auth required)
  async getLiveTheme(): Promise<ApiResponse<TenantTheme>> {
    return await apiClient.get<ApiResponse<TenantTheme>>('/owner/theme/live');
  },

  // Get single theme with full version history (admin)
  async getThemeById(id: string): Promise<ApiResponse<TenantTheme>> {
    return await apiClient.get<ApiResponse<TenantTheme>>(`/owner/theme/${id}`);
  },

  // Save draft changes to design tokens & brand settings
  async updateTheme(
    id: string,
    payload: UpdateThemePayload
  ): Promise<ApiResponse<TenantTheme>> {
    return await apiClient.patch<ApiResponse<TenantTheme>>(
      `/owner/theme/${id}`,
      payload
    );
  },

  // Publish theme live to storefront (creates version snapshot)
  async publishTheme(
    id: string,
    payload?: PublishThemePayload
  ): Promise<ApiResponse<TenantTheme>> {
    return await apiClient.post<ApiResponse<TenantTheme>>(
      `/owner/theme/${id}/publish`,
      payload || {}
    );
  },

  // Batch reorder sections and/or toggle visibility — PATCH (not PUT)
  async reorderSections(
    themeId: string,
    payload: ReorderSectionsPayload
  ): Promise<ApiResponse<ThemeSection[]>> {
    return await apiClient.patch<ApiResponse<ThemeSection[]>>(
      `/owner/theme/${themeId}/sections/reorder`,
      payload
    );
  },

  // Restore theme tokens & sections from a past version snapshot
  async restoreVersion(
    themeId: string,
    versionId: string
  ): Promise<ApiResponse<TenantTheme>> {
    return await apiClient.post<ApiResponse<TenantTheme>>(
      `/owner/theme/${themeId}/restore/${versionId}`,
      {}
    );
  },
};
