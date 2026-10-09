// Customer Order Service - Communicates with backend /customer/orders endpoints
import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type { Order, OrderStatus } from '@/types/commerce';
import { orders as seedOrders } from '@/data/orders';

// Payload for an individual item in a new order
export interface CreateOrderItemPayload {
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  price: number;
  qty: number;
  image?: string;
  color?: string;
  size?: string;
}

// Payload for delivery shipping address
export interface CreateOrderAddressPayload {
  name: string;
  phone: string;
  line1: string;
  area: string;
  district: string;
}

// Complete payload sent when placing a new order
export interface CreateOrderPayload {
  shippingAddress: CreateOrderAddressPayload;
  items: CreateOrderItemPayload[];
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  discount?: number;
  paymentMethod: string;
  paymentStatus?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  couponCode?: string;
  customerNote?: string;
  tenantId?: string;
}

// Payload to update order status, tracking, and fulfillment (Owner)
export interface UpdateOrderStatusPayload {
  status?: OrderStatus | string;
  fulfillmentStatus?: string;
  paymentStatus?: string;
  courier?: string;
  trackingNumber?: string;
  note?: string;
}

// Payload to add an admin note to an order (Owner)
export interface AddOrderNotePayload {
  text: string;
  internal?: boolean;
}

// Query parameters for fetching owner orders with filtering and pagination
export interface OwnerOrderQueryParams {
  search?: string;
  tab?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  paymentMethod?: string;
  channel?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  tenantId?: string;
}

// Response structure for owner orders list with counts
export interface OwnerOrdersResponseData {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    all: number;
    unfulfilled: number;
    unpaid: number;
    packed: number;
    shipped: number;
    returns: number;
    closed: number;
  };
}

// Payload for creating a manual / draft order from owner dashboard
export interface CreateDraftOrderItemPayload {
  productId?: string;
  variantId?: string;
  title: string;
  image?: string;
  color?: string;
  size?: string;
  sku?: string;
  price: number;
  qty: number;
}

export interface CreateDraftOrderPayload {
  customerId?: string;
  customerName: string;
  email?: string;
  phone: string;
  shippingAddress?: {
    name: string;
    phone: string;
    line1: string;
    area: string;
    district: string;
  };
  items: CreateDraftOrderItemPayload[];
  shippingFee?: number;
  discount?: number;
  couponCode?: string;
  paymentMethod?: string;
  mode?: 'invoice' | 'paid' | 'draft';
  customerNote?: string;
  staffNote?: string;
  tenantId?: string;
}

// Response structure for draft orders list
export interface DraftOrdersResponseData {
  drafts: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    all: number;
    open: number;
    completed: number;
    cancelled: number;
  };
}

// Helper to transform backend order response to frontend Order interface
export function mapBackendOrderToFrontend(item: any): Order {
  return {
    id: item.id,
    number: item.number,
    customerId: item.customerId || '',
    customerName: item.customerName || '',
    email: item.email || '',
    phone: item.phone || '',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    items: (item.items || []).map((i: any) => ({
      productId: i.productId,
      variantId: i.variantId || '',
      title: i.title,
      image: i.image || '',
      color: i.color || '',
      size: i.size || '',
      sku: i.sku || '',
      price: Number(i.price) || 0,
      qty: Number(i.qty) || 1,
    })),
    subtotal: Number(item.subtotal) || 0,
    discount: Number(item.discount) || 0,
    shipping: Number(item.shipping) || 0,
    tax: Number(item.tax) || 0,
    total: Number(item.total) || 0,
    refunded: Number(item.refunded) || 0,
    couponCode: item.couponCode || undefined,
    paymentMethod: (item.paymentMethod?.toLowerCase() || 'cod') as any,
    paymentStatus: (item.paymentStatus?.toLowerCase() || 'pending') as any,
    status: (item.status?.toLowerCase() || 'confirmed') as any,
    fulfillmentStatus: (item.fulfillmentStatus?.toLowerCase() || 'unfulfilled') as any,
    shippingAddress: item.shippingAddress
      ? {
          id: item.shippingAddress.id || `addr-${item.id}`,
          label: 'Delivery Address',
          name: item.shippingAddress.name,
          phone: item.shippingAddress.phone,
          line1: item.shippingAddress.line1,
          area: item.shippingAddress.area,
          district: item.shippingAddress.district,
        }
      : { id: `addr-${item.id}`, label: 'Delivery Address', name: '', phone: '', line1: '', area: '', district: '' },
    shippingMethod: item.shippingMethod || 'standard',
    courier: item.courier || undefined,
    tracking: item.trackingNumber || undefined,
    timeline: (item.timeline || []).map((t: any) => ({
      at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      label: t.label,
      by: t.by || undefined,
      note: t.note || undefined,
    })),
    attempts: (item.attempts || []).map((a: any) => ({
      id: a.id,
      method: (a.method?.toLowerCase() || 'cod') as any,
      amount: Number(a.amount) || 0,
      status: (a.status?.toLowerCase() || 'pending') as any,
      ref: a.gatewayRef || '',
      at: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    })),
    notes: (item.notes || []).map((n: any) => ({
      text: n.text,
      internal: !!n.internal,
      by: n.by || '',
      at: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    })),
    channel: (item.channel?.toLowerCase() === 'manual' ? 'manual' : 'online') as 'online' | 'manual',
    codCollected: !!item.codCollected,
    customerNote: item.customerNote || undefined,
  };
}

export const orderService = {
  // ----------------------------------------------------
  // Customer Endpoints (/customer/orders)
  // ----------------------------------------------------

  // 1. Send new order payload from checkout page to backend API
  async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    const res = await apiClient.post<ApiResponse<any>>('/customer/orders', payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return res;
  },

  // 2. Fetch all previous orders for the authenticated customer
  async getCustomerOrders(tenantId?: string): Promise<ApiResponse<Order[]>> {
    const endpoint = tenantId
      ? `/customer/orders?tenantId=${encodeURIComponent(tenantId)}`
      : '/customer/orders';
    const res = await apiClient.get<ApiResponse<any[]>>(endpoint);
    if (Array.isArray(res?.data)) {
      return {
        ...res,
        data: res.data.map(mapBackendOrderToFrontend),
      };
    }
    return {
      success: true,
      data: [],
      message: res?.message || 'Orders retrieved',
    };
  },

  // 3. Load full details and live tracking data for a specific order (Customer)
  async getOrderDetail(orderNumber: string, tenantId?: string): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/customer/orders/${encodeURIComponent(orderNumber)}?tenantId=${encodeURIComponent(tenantId)}`
      : `/customer/orders/${encodeURIComponent(orderNumber)}`;
    const res = await apiClient.get<ApiResponse<any>>(endpoint);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return res;
  },

  // ----------------------------------------------------
  // Owner Endpoints (/owner/orders)
  // ----------------------------------------------------

  // 4. Fetch all store orders with search, filters, pagination, and status counters (Owner)
  async getOwnerOrders(params: OwnerOrderQueryParams = {}): Promise<ApiResponse<OwnerOrdersResponseData>> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.tab && params.tab !== 'all') query.set('tab', params.tab);
    else if (params.status && params.status !== 'all') query.set('tab', params.status);
    if (params.paymentStatus && params.paymentStatus !== 'all') query.set('paymentStatus', params.paymentStatus.toUpperCase());
    if (params.fulfillmentStatus && params.fulfillmentStatus !== 'all') query.set('fulfillmentStatus', params.fulfillmentStatus.toUpperCase());
    if (params.paymentMethod && params.paymentMethod !== 'all') query.set('paymentMethod', params.paymentMethod.toUpperCase());
    if (params.channel && params.channel !== 'all') query.set('channel', params.channel.toUpperCase());
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.tenantId) query.set('tenantId', params.tenantId);

    const qs = query.toString();
    const endpoint = `/owner/orders${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<ApiResponse<any>>(endpoint);

    if (res?.data) {
      const rawOrders = Array.isArray(res.data.orders) ? res.data.orders : [];
      return {
        ...res,
        data: {
          orders: rawOrders.map(mapBackendOrderToFrontend),
          pagination: res.data.pagination || { total: rawOrders.length, page: 1, limit: 20, totalPages: 1 },
          counts: res.data.counts || { all: 0, unfulfilled: 0, unpaid: 0, packed: 0, shipped: 0, returns: 0, closed: 0 },
        },
      };
    }

    return res;
  },

  // 5. Get full single order details by id or order number (Owner)
  async getOwnerOrderDetail(id: string, tenantId?: string): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}`;
    const res = await apiClient.get<ApiResponse<any>>(endpoint);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return res;
  },

  // 6. Update order status, fulfillment, courier, tracking, and notes (Owner)
  async updateOwnerOrderStatus(
    id: string,
    payload: UpdateOrderStatusPayload,
    tenantId?: string,
  ): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}/status?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}/status`;

    const body: any = {};
    if (payload.status) body.status = payload.status.toUpperCase();
    if (payload.fulfillmentStatus) body.fulfillmentStatus = payload.fulfillmentStatus.toUpperCase();
    if (payload.paymentStatus) body.paymentStatus = payload.paymentStatus.toUpperCase();
    if (payload.courier) body.courier = payload.courier;
    if (payload.trackingNumber) body.trackingNumber = payload.trackingNumber;
    if (payload.note) body.note = payload.note;

    const res = await apiClient.patch<ApiResponse<any>>(endpoint, body);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return res;
  },

  // 7. Add an internal or customer note to the order (Owner)
  async addOwnerOrderNote(
    id: string,
    payload: AddOrderNotePayload,
    tenantId?: string,
  ): Promise<ApiResponse<any>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}/notes?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}/notes`;
    return await apiClient.post<ApiResponse<any>>(endpoint, payload);
  },

  // 8. Create manual or draft order (Owner)
  async createDraftOrder(payload: CreateDraftOrderPayload): Promise<ApiResponse<Order>> {
    const res = await apiClient.post<ApiResponse<any>>('/owner/orders/drafts', payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return res;
  },

  // 9. Fetch all draft and manual orders (Owner)
  async getDraftOrders(params: OwnerOrderQueryParams = {}): Promise<ApiResponse<DraftOrdersResponseData>> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.status && params.status !== 'all') query.set('status', params.status.toUpperCase());
    if (params.paymentStatus && params.paymentStatus !== 'all') query.set('paymentStatus', params.paymentStatus.toUpperCase());
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.tenantId) query.set('tenantId', params.tenantId);

    const qs = query.toString();
    const endpoint = `/owner/orders/drafts${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<ApiResponse<any>>(endpoint);

    if (res?.data) {
      const rawDrafts = Array.isArray(res.data.drafts) ? res.data.drafts : [];
      return {
        ...res,
        data: {
          drafts: rawDrafts.map(mapBackendOrderToFrontend),
          total: Number(res.data.total) || rawDrafts.length,
          page: Number(res.data.page) || 1,
          limit: Number(res.data.limit) || 50,
          totalPages: Number(res.data.totalPages) || 1,
          counts: res.data.counts || { all: 0, open: 0, completed: 0, cancelled: 0 },
        },
      };
    }

    return res;
  },

  // ----------------------------------------------------
  // Legacy / Fallback helpers with mock seed data support
  // ----------------------------------------------------
  async getOrders(): Promise<Order[]> {
    try {
      const res = await apiClient.get<ApiResponse<any>>('/owner/orders');
      if (res?.data?.orders) {
        return res.data.orders.map(mapBackendOrderToFrontend);
      }
      return seedOrders;
    } catch {
      return seedOrders;
    }
  },

  async getOrderById(idOrNumber: string): Promise<Order | undefined> {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/owner/orders/${idOrNumber}`);
      if (res?.data) {
        return mapBackendOrderToFrontend(res.data);
      }
      return seedOrders.find((o) => o.id === idOrNumber || o.number === idOrNumber);
    } catch {
      return seedOrders.find((o) => o.id === idOrNumber || o.number === idOrNumber);
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, eventData?: any): Promise<boolean> {
    try {
      await apiClient.patch(`/owner/orders/${orderId}/status`, {
        status: status.toUpperCase(),
        ...eventData,
      });
      return true;
    } catch {
      return true;
    }
  },

  async addOrderNote(orderId: string, text: string, internal: boolean, by: string): Promise<boolean> {
    try {
      await apiClient.post(`/owner/orders/${orderId}/notes`, { text, internal });
      return true;
    } catch {
      return true;
    }
  },
};
