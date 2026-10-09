import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type { Tenant } from '@/types/tenant';

export interface UpdateStoreSettingsPayload {
  name?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: 'prefix' | 'suffix';
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    workingHours?: string;
    responseTime?: string;
    supportTeam?: string;
  };
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  settings?: Record<string, any>;
  announcement?: string;
  announcementEnabled?: boolean;
}

export const storeService = {
  // 1. Get public store info (for storefront Contact page, Footer, etc.)
  async getPublicStoreInfo(slug?: string): Promise<ApiResponse<Tenant>> {
    const query = slug ? `?slug=${encodeURIComponent(slug)}` : '';
    return await apiClient.get<ApiResponse<Tenant>>(`/customer/store-info${query}`);
  },

  // 2. Get owner store settings (for Admin Settings page)
  async getOwnerSettings(): Promise<ApiResponse<any>> {
    return await apiClient.get<ApiResponse<any>>('/owner/settings');
  },

  // 3. Update owner store settings & contact information
  async updateOwnerSettings(payload: UpdateStoreSettingsPayload): Promise<ApiResponse<any>> {
    return await apiClient.patch<ApiResponse<any>>('/owner/settings', payload);
  },
};
