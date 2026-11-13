import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type { Tenant } from '@/types/tenant';

export interface StoreFlags {
  guest?: boolean;
  phoneOtp?: boolean;
  notes?: boolean;
  maintenance?: boolean;
  cookie?: boolean;
  social?: boolean;
  mfa?: boolean;
  vatIncl?: boolean;
  vatShip?: boolean;
  photos?: boolean;
  exchanges?: boolean;
  finalSale?: boolean;
  vatRate?: string;
  binNumber?: string;
  returnWindow?: string;
}

export interface StoreSettingsBag {
  authPage?: unknown;
  shipping?: {
    insideDhaka?: number;
    outsideDhaka?: number;
    freeDeliveryThreshold?: number;
    freeShippingThreshold?: number;
    insideDhakaEst?: string;
    outsideDhakaEst?: string;
    pickup?: boolean;
  };
  trustPoints?: { title: string; body: string }[];
  orderNumberFormat?: string;
  flags?: StoreFlags;
  pm?: { bkash?: boolean; nagad?: boolean; cod?: boolean };
  payment?: {
    bkashNumber?: string;
    bkashType?: string;
    bkashEnabled?: boolean;
    nagadNumber?: string;
    nagadType?: string;
    nagadEnabled?: boolean;
    codEnabled?: boolean;
  };
}

export interface OwnerSettingsData {
  name?: string;
  tagline?: string;
  logo?: string;
  favicon?: string;
  currency?: string;
  currencySymbol?: string;
  currencyPosition?: 'prefix' | 'suffix';
  announcement?: string;
  announcementEnabled?: boolean;
  contact?: UpdateStoreSettingsPayload['contact'];
  socials?: UpdateStoreSettingsPayload['socials'];
  settings?: StoreSettingsBag;
}

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
  settings?: StoreSettingsBag;
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
  async getOwnerSettings(): Promise<ApiResponse<OwnerSettingsData>> {
    return await apiClient.get<ApiResponse<OwnerSettingsData>>('/owner/settings');
  },

  // 3. Update owner store settings & contact information
  async updateOwnerSettings(payload: UpdateStoreSettingsPayload): Promise<ApiResponse<OwnerSettingsData>> {
    return await apiClient.patch<ApiResponse<OwnerSettingsData>>('/owner/settings', payload);
  },

  // 4. Upload / replace store logo image
  async uploadOwnerLogo(file: File): Promise<ApiResponse<OwnerSettingsData>> {
    const formData = new FormData();
    formData.append('logo', file);
    return await apiClient.patch<ApiResponse<OwnerSettingsData>>('/owner/settings/logo', formData);
  },

  // 5. Remove store logo
  async removeOwnerLogo(): Promise<ApiResponse<OwnerSettingsData>> {
    return await apiClient.delete<ApiResponse<OwnerSettingsData>>('/owner/settings/logo');
  },
};
