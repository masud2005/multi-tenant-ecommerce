// Customer Address Service - Communicates with /customer/addresses backend endpoints
import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export interface CustomerAddress {
  id: string;
  customerProfileId?: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  district: string;
  area: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressPayload {
  label?: string;
  name: string;
  phone: string;
  line1: string;
  district: string;
  area: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  tenantId?: string;
}

export interface UpdateAddressPayload {
  label?: string;
  name?: string;
  phone?: string;
  line1?: string;
  district?: string;
  area?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  tenantId?: string;
}

export const addressService = {
  /**
   * Get all saved delivery addresses for the authenticated customer
   */
  async getAddresses(tenantId?: string): Promise<ApiResponse<CustomerAddress[]>> {
    const endpoint = tenantId
      ? `/customer/addresses?tenantId=${encodeURIComponent(tenantId)}`
      : '/customer/addresses';
    return await apiClient.get<ApiResponse<CustomerAddress[]>>(endpoint);
  },

  /**
   * Save / Create a new delivery address
   */
  async saveAddress(payload: CreateAddressPayload): Promise<ApiResponse<CustomerAddress>> {
    return await apiClient.post<ApiResponse<CustomerAddress>>(
      '/customer/addresses',
      payload,
    );
  },

  /**
   * Alias for saveAddress (createAddress)
   */
  async createAddress(payload: CreateAddressPayload): Promise<ApiResponse<CustomerAddress>> {
    return this.saveAddress(payload);
  },

  /**
   * Update an existing delivery address
   */
  async updateAddress(
    id: string,
    payload: UpdateAddressPayload,
  ): Promise<ApiResponse<CustomerAddress>> {
    return await apiClient.patch<ApiResponse<CustomerAddress>>(
      `/customer/addresses/${id}`,
      payload,
    );
  },

  /**
   * Delete a saved address by ID
   */
  async deleteAddress(id: string, tenantId?: string): Promise<ApiResponse<null>> {
    const endpoint = tenantId
      ? `/customer/addresses/${id}?tenantId=${encodeURIComponent(tenantId)}`
      : `/customer/addresses/${id}`;
    return await apiClient.delete<ApiResponse<null>>(endpoint);
  },
};
