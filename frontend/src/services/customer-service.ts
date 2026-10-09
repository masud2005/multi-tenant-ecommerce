import { apiClient } from './api-client';
import type { ApiResponse, PaginatedResponse, PaginatedMeta } from '@/types';
import type { Customer } from '@/types/commerce';

// Query parameters for fetching owner customers list
export interface OwnerCustomerQueryParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  tenantId?: string;
}

// Payload for updating customer active / inactive / ban status
export interface UpdateCustomerStatusPayload {
  isActive?: boolean;
}

// Payload for updating customer tags, store credit, or profile info
export interface UpdateCustomerPayload {
  tags?: string[];
  storeCredit?: number;
  name?: string;
  phone?: string;
}

// Response structure for paginated customer list
export interface OwnerCustomersResponseData {
  customers: Customer[];
  meta: PaginatedMeta;
}

// Helper to transform backend customer profile data to frontend Customer interface
export function mapBackendCustomerToFrontend(item: any): Customer {
  const defaultAddr = Array.isArray(item.addresses)
    ? item.addresses.find((a: any) => a.isDefaultShipping) || item.addresses[0]
    : null;

  return {
    id: item.id,
    name: item.name || 'Customer',
    email: item.email || '',
    phone: item.phone || defaultAddr?.phone || '',
    district: item.district || defaultAddr?.district || 'Dhaka',
    orders: Number(item.ordersCount) || Number(item._count?.orders) || 0,
    spent: Number(item.totalSpent) || 0,
    lastOrder: item.orders?.[0]?.createdAt
      ? new Date(item.orders[0].createdAt).toISOString().split('T')[0]
      : '',
    joined: item.createdAt
      ? new Date(item.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    tags: Array.isArray(item.tags) ? item.tags : [],
    segment: (item.segment || 'New') as any,
    status: item.isActive === false ? 'inactive' : 'active',
    marketingConsent: !!item.marketingConsent,
    storeCredit: Number(item.storeCredit) || 0,
    avatar: item.avatar || undefined,
  };
}

export const customerService = {
  // ----------------------------------------------------
  // Owner Endpoints (/owner/customers)
  // ----------------------------------------------------

  // 1. GET /api/v1/owner/customers - Fetch paginated customers with search & sorting
  async getOwnerCustomers(
    params: OwnerCustomerQueryParams = {},
  ): Promise<ApiResponse<OwnerCustomersResponseData>> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.tenantId) query.set('tenantId', params.tenantId);

    const qs = query.toString();
    const endpoint = `/owner/customers${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<PaginatedResponse<any>>(endpoint);

    if (res?.data) {
      const rawList = Array.isArray(res.data) ? res.data : [];
      return {
        success: res.success,
        message: res.message,
        data: {
          customers: rawList.map(mapBackendCustomerToFrontend),
          meta: res.meta || {
            page: Number(params.page) || 1,
            limit: Number(params.limit) || 50,
            total: rawList.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      };
    }

    return res as any;
  },

  // 2. GET /api/v1/owner/customers/:id - Fetch single customer details with order history & addresses
  async getOwnerCustomerDetail(id: string, tenantId?: string): Promise<ApiResponse<any>> {
    const endpoint = tenantId
      ? `/owner/customers/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/customers/${encodeURIComponent(id)}`;
    return await apiClient.get<ApiResponse<any>>(endpoint);
  },

  // 3. PATCH /api/v1/owner/customers/:id/status - Toggle or set customer active/inactive status
  async updateCustomerStatus(
    id: string,
    payload?: UpdateCustomerStatusPayload,
    tenantId?: string,
  ): Promise<ApiResponse<any>> {
    const endpoint = tenantId
      ? `/owner/customers/${encodeURIComponent(id)}/status?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/customers/${encodeURIComponent(id)}/status`;
    return await apiClient.patch<ApiResponse<any>>(endpoint, payload || {});
  },

  // 4. PATCH /api/v1/owner/customers/:id - Update tags, store credit, name, or phone
  async updateCustomerProfile(
    id: string,
    payload: UpdateCustomerPayload,
    tenantId?: string,
  ): Promise<ApiResponse<any>> {
    const endpoint = tenantId
      ? `/owner/customers/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/customers/${encodeURIComponent(id)}`;
    return await apiClient.patch<ApiResponse<any>>(endpoint, payload);
  },

  // ----------------------------------------------------
  // Fallback / Standard helpers
  // ----------------------------------------------------

  // Fetch customer list
  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/owner/customers');
      if (Array.isArray(res?.data)) {
        return res.data.map(mapBackendCustomerToFrontend);
      }
      return [];
    } catch {
      return [];
    }
  },

  // Fetch single customer by ID
  async getCustomerById(id: string): Promise<Customer | undefined> {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/owner/customers/${id}`);
      if (res?.data) {
        return mapBackendCustomerToFrontend(res.data);
      }
      return undefined;
    } catch {
      return undefined;
    }
  },

  // Toggle active / inactive status
  async toggleStatus(id: string): Promise<boolean> {
    try {
      await apiClient.patch(`/owner/customers/${id}/status`, {});
      return true;
    } catch {
      return true;
    }
  },

  // Update customer info
  async updateCustomer(id: string, data: UpdateCustomerPayload): Promise<boolean> {
    try {
      await apiClient.patch(`/owner/customers/${id}`, data);
      return true;
    } catch {
      return true;
    }
  },
};
