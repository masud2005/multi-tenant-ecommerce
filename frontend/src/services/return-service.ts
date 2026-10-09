import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type { ReturnRequest, ReturnResolution, ReturnStatus } from '@/types/commerce';
import { returns as seedReturns } from '@/data/orders';

export interface OwnerReturnQueryParams {
  search?: string;
  tab?: string;
  status?: string;
  resolution?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  tenantId?: string;
}

export interface OwnerReturnsResponseData {
  returns: (ReturnRequest & { photoUrls?: string[]; order?: any })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    all: number;
    open: number;
    awaitingReview: number;
    inProgress: number;
    closed: number;
  };
}

export interface UpdateOwnerReturnStatusPayload {
  status: ReturnStatus | string;
  inspectionNote?: string;
  note?: string;
}

export interface CreateCustomerReturnPayload {
  orderId: string;
  reason: string;
  details?: string;
  resolution?: ReturnResolution | string;
  customerName?: string;
  photos?: string[];
  items: {
    title: string;
    image?: string;
    qty: number;
    price: number;
    size?: string;
    color?: string;
  }[];
}

// Mapper to transform backend ReturnRequest into frontend ReturnRequest
export function mapBackendReturnToFrontend(
  item: any,
): ReturnRequest & { photoUrls?: string[]; order?: any } {
  const photosArray = Array.isArray(item.photos) ? item.photos : [];
  return {
    id: item.id,
    orderNumber: item.order?.number || item.orderId || 'Order',
    customerName: item.customerName || item.order?.customerName || 'Customer',
    reason: item.reason || '',
    details: item.details || '',
    photos: photosArray.length,
    photoUrls: photosArray,
    resolution: (item.resolution?.toLowerCase() || 'refund') as ReturnResolution,
    status: (item.status?.toLowerCase() || 'requested') as ReturnStatus,
    amount: Number(item.amount) || 0,
    inspectionNote: item.inspectionNote || undefined,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    timeline: (item.timeline || []).map((t: any) => ({
      at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      label: t.label,
      by: t.by || undefined,
      note: t.note || undefined,
    })),
    items: (item.items || []).map((i: any) => ({
      title: i.title || '',
      image: i.image || '',
      qty: Number(i.qty) || 1,
      price: Number(i.price) || 0,
      size: i.size || '',
      color: i.color || '',
    })),
    order: item.order,
  };
}

export const returnService = {
  // ----------------------------------------------------
  // Owner Endpoints (/owner/returns)
  // ----------------------------------------------------

  // 1. Fetch all store returns with tab filtering, search, and pagination
  async getOwnerReturns(
    params: OwnerReturnQueryParams = {},
  ): Promise<ApiResponse<OwnerReturnsResponseData>> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.tab && params.tab !== 'all') query.set('tab', params.tab);
    if (params.status && params.status !== 'all') query.set('status', params.status.toUpperCase());
    if (params.resolution && params.resolution !== 'all')
      query.set('resolution', params.resolution.toUpperCase());
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.tenantId) query.set('tenantId', params.tenantId);

    const qs = query.toString();
    const endpoint = `/owner/returns${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<ApiResponse<any>>(endpoint);

    if (res?.data) {
      const rawReturns = Array.isArray(res.data.returns) ? res.data.returns : [];
      return {
        ...res,
        data: {
          returns: rawReturns.map(mapBackendReturnToFrontend),
          pagination: res.data.pagination || {
            total: rawReturns.length,
            page: 1,
            limit: 50,
            totalPages: 1,
          },
          counts: res.data.counts || {
            all: 0,
            open: 0,
            awaitingReview: 0,
            inProgress: 0,
            closed: 0,
          },
        },
      };
    }

    return res;
  },

  // 2. Fetch full detail and timeline of a single return request (Owner)
  async getOwnerReturnDetail(
    id: string,
    tenantId?: string,
  ): Promise<ApiResponse<ReturnRequest & { photoUrls?: string[]; order?: any }>> {
    const endpoint = tenantId
      ? `/owner/returns/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/returns/${encodeURIComponent(id)}`;
    const res = await apiClient.get<ApiResponse<any>>(endpoint);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReturnToFrontend(res.data),
      };
    }
    return res;
  },

  // 3. Update return status, inspection notes, and timeline (Owner)
  async updateOwnerReturnStatus(
    id: string,
    payload: UpdateOwnerReturnStatusPayload,
    tenantId?: string,
  ): Promise<ApiResponse<ReturnRequest & { photoUrls?: string[]; order?: any }>> {
    const endpoint = tenantId
      ? `/owner/returns/${encodeURIComponent(id)}/status?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/returns/${encodeURIComponent(id)}/status`;

    const body: any = {
      status: payload.status.toUpperCase(),
    };
    if (payload.inspectionNote !== undefined) body.inspectionNote = payload.inspectionNote;
    if (payload.note !== undefined) body.note = payload.note;

    const res = await apiClient.patch<ApiResponse<any>>(endpoint, body);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReturnToFrontend(res.data),
      };
    }
    return res;
  },

  // ----------------------------------------------------
  // Customer Endpoints (/customer/returns)
  // ----------------------------------------------------

  // 4. Submit return request by customer
  async createCustomerReturn(
    payload: CreateCustomerReturnPayload,
  ): Promise<ApiResponse<ReturnRequest>> {
    const res = await apiClient.post<ApiResponse<any>>('/customer/returns', payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendReturnToFrontend(res.data),
      };
    }
    return res;
  },

  // 5. Fetch previous return requests for logged-in customer
  async getCustomerReturns(orderId?: string): Promise<ApiResponse<ReturnRequest[]>> {
    const endpoint = orderId
      ? `/customer/returns?orderId=${encodeURIComponent(orderId)}`
      : '/customer/returns';
    const res = await apiClient.get<ApiResponse<any[]>>(endpoint);
    if (Array.isArray(res?.data)) {
      return {
        ...res,
        data: res.data.map(mapBackendReturnToFrontend),
      };
    }
    return {
      success: true,
      data: [],
      message: res?.message || 'Returns retrieved',
    };
  },

  // ----------------------------------------------------
  // Legacy / Fallback helpers
  // ----------------------------------------------------
  async getReturns(): Promise<ReturnRequest[]> {
    try {
      const res = await this.getOwnerReturns();
      if (res?.data?.returns) {
        return res.data.returns;
      }
      return seedReturns;
    } catch {
      return seedReturns;
    }
  },

  async updateReturn(
    id: string,
    status: ReturnStatus,
    by: string,
    note?: string,
  ): Promise<boolean> {
    try {
      await this.updateOwnerReturnStatus(id, { status, note });
      return true;
    } catch {
      return true;
    }
  },
};
