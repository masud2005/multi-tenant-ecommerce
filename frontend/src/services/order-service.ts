// Customer Order Service - Communicates with backend /customer/orders endpoints
import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import { unchangedEnvelope } from '@/types/api';
import type {
  FulfillmentStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/types/commerce';
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
  senderPhone?: string;
  transactionId?: string;
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



interface BackendOrderLine {
  productId?: string;
  variantId?: string;
  title?: string;
  image?: string;
  color?: string;
  size?: string;
  sku?: string;
  price?: number | string;
  qty?: number | string;
}

interface BackendStamp {
  createdAt?: string;
  label?: string;
  by?: string;
  note?: string;
  text?: string;
  internal?: boolean;
}

interface BackendAttempt {
  id?: string;
  method?: string;
  amount?: number | string;
  status?: string;
  gatewayRef?: string;
  createdAt?: string;
}

interface BackendAddress {
  id?: string;
  name?: string;
  phone?: string;
  line1?: string;
  area?: string;
  district?: string;
}

interface BackendOrderList {
  orders?: BackendOrder[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
  counts?: {
    all: number;
    unfulfilled: number;
    unpaid: number;
    packed: number;
    shipped: number;
    returns: number;
    closed: number;
  };
}

export interface BackendOrder {
  id: string;
  number?: string;
  customerId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  items?: BackendOrderLine[];
  subtotal?: number | string;
  discount?: number | string;
  shipping?: number | string;
  tax?: number | string;
  total?: number | string;
  refunded?: number | string;
  couponCode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  fulfillmentStatus?: string;
  shippingAddress?: BackendAddress | null;
  shippingMethod?: string;
  courier?: string;
  trackingNumber?: string;
  timeline?: BackendStamp[];
  attempts?: BackendAttempt[];
  notes?: BackendStamp[];
  channel?: string;
  codCollected?: boolean;
  customerNote?: string;
}

// Helper to transform backend order response to frontend Order interface
export function mapBackendOrderToFrontend(item: BackendOrder): Order {
  return {
    id: item.id,
    number: item.number || '',
    customerId: item.customerId || '',
    customerName: item.customerName || '',
    email: item.email || '',
    phone: item.phone || '',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    items: (item.items || []).map((i) => ({
      productId: i.productId || '',
      variantId: i.variantId || '',
      title: i.title || '',
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
    paymentMethod: (item.paymentMethod?.toLowerCase() || 'cod') as PaymentMethod,
    paymentStatus: (item.paymentStatus?.toLowerCase() || 'pending') as PaymentStatus,
    status: (item.status?.toLowerCase() || 'confirmed') as OrderStatus,
    fulfillmentStatus: (item.fulfillmentStatus?.toLowerCase() || 'unfulfilled') as FulfillmentStatus,
    shippingAddress: item.shippingAddress
      ? {
          id: item.shippingAddress.id || `addr-${item.id}`,
          label: 'Delivery Address',
          name: item.shippingAddress.name || '',
          phone: item.shippingAddress.phone || '',
          line1: item.shippingAddress.line1 || '',
          area: item.shippingAddress.area || '',
          district: item.shippingAddress.district || '',
        }
      : { id: `addr-${item.id}`, label: 'Delivery Address', name: '', phone: '', line1: '', area: '', district: '' },
    shippingMethod: item.shippingMethod || 'standard',
    courier: item.courier || undefined,
    tracking: item.trackingNumber || undefined,
    timeline: (item.timeline || []).map((t) => ({
      at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      label: t.label || '',
      by: t.by || undefined,
      note: t.note || undefined,
    })),
    attempts: (item.attempts || []).map((a) => {
      let senderPhone = '';
      let transactionId = '';
      if (a.gatewayRef) {
        try {
          const parsed = JSON.parse(a.gatewayRef);
          senderPhone = parsed.senderPhone || '';
          transactionId = parsed.transactionId || '';
        } catch {
          transactionId = a.gatewayRef;
        }
      }
      return {
        id: a.id || '',
        method: (a.method?.toLowerCase() || 'cod') as PaymentMethod,
        amount: Number(a.amount) || 0,
        status: (a.status?.toLowerCase() || 'pending') as PaymentStatus,
        ref: a.gatewayRef || '',
        senderPhone,
        transactionId,
        at: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      };
    }),
    notes: (item.notes || []).map((n) => ({
      text: n.text || '',
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
    const res = await apiClient.post<ApiResponse<BackendOrder>>('/customer/orders', payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
  },

  // 2. Fetch all previous orders for the authenticated customer
  async getCustomerOrders(tenantId?: string): Promise<ApiResponse<Order[]>> {
    const endpoint = tenantId
      ? `/customer/orders?tenantId=${encodeURIComponent(tenantId)}`
      : '/customer/orders';
    const res = await apiClient.get<ApiResponse<BackendOrder[]>>(endpoint);
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
    const res = await apiClient.get<ApiResponse<BackendOrder>>(endpoint);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
  },

  // 3b. Customer self-cancel before packed/shipped
  async cancelCustomerOrder(
    orderNumberOrId: string,
    tenantId?: string,
  ): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/customer/orders/${encodeURIComponent(orderNumberOrId)}/cancel?tenantId=${encodeURIComponent(tenantId)}`
      : `/customer/orders/${encodeURIComponent(orderNumberOrId)}/cancel`;
    const res = await apiClient.patch<ApiResponse<BackendOrder>>(endpoint, {});
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
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
    const res = await apiClient.get<ApiResponse<BackendOrderList>>(endpoint);

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

    return unchangedEnvelope<OwnerOrdersResponseData>(res);
  },

  // 5. Get full single order details by id or order number (Owner)
  async getOwnerOrderDetail(id: string, tenantId?: string): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}`;
    const res = await apiClient.get<ApiResponse<BackendOrder>>(endpoint);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
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

    const body: {
      status?: string;
      fulfillmentStatus?: string;
      paymentStatus?: string;
      courier?: string;
      trackingNumber?: string;
      note?: string;
    } = {};
    if (payload.status) body.status = payload.status.toUpperCase();
    if (payload.fulfillmentStatus) body.fulfillmentStatus = payload.fulfillmentStatus.toUpperCase();
    if (payload.paymentStatus) body.paymentStatus = payload.paymentStatus.toUpperCase();
    if (payload.courier) body.courier = payload.courier;
    if (payload.trackingNumber) body.trackingNumber = payload.trackingNumber;
    if (payload.note) body.note = payload.note;

    const res = await apiClient.patch<ApiResponse<BackendOrder>>(endpoint, body);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
  },

  // 7. Verify or reject customer manual bKash/Nagad payment (Owner)
  async verifyPayment(
    id: string,
    approved: boolean,
    note?: string,
    tenantId?: string,
  ): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}/verify-payment?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}/verify-payment`;

    const res = await apiClient.patch<ApiResponse<BackendOrder>>(endpoint, { approved, note });
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
  },

  // 7. Add an internal or customer note to the order (Owner)
  async addOwnerOrderNote(
    id: string,
    payload: AddOrderNotePayload,
    tenantId?: string,
  ): Promise<ApiResponse<BackendOrder>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}/notes?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}/notes`;
    return await apiClient.post<ApiResponse<BackendOrder>>(endpoint, payload);
  },

  // 8. Record manual refund (Owner) — no payment gateway payout
  async refundOwnerOrder(
    id: string,
    payload: { amount: number; reason?: string; restock?: boolean },
    tenantId?: string,
  ): Promise<ApiResponse<Order>> {
    const endpoint = tenantId
      ? `/owner/orders/${encodeURIComponent(id)}/refund?tenantId=${encodeURIComponent(tenantId)}`
      : `/owner/orders/${encodeURIComponent(id)}/refund`;
    const res = await apiClient.post<ApiResponse<BackendOrder>>(endpoint, payload);
    if (res?.data) {
      return {
        ...res,
        data: mapBackendOrderToFrontend(res.data),
      };
    }
    return unchangedEnvelope<Order>(res);
  },

  async getOrders(): Promise<Order[]> {
    const res = await apiClient.get<ApiResponse<BackendOrderList>>('/owner/orders');
    if (res?.data?.orders) {
      return res.data.orders.map(mapBackendOrderToFrontend);
    }
    return [];
  },

  async getOrderById(idOrNumber: string): Promise<Order | undefined> {
    const res = await apiClient.get<ApiResponse<BackendOrder>>(
      `/owner/orders/${encodeURIComponent(idOrNumber)}`,
    );
    if (res?.data) {
      return mapBackendOrderToFrontend(res.data);
    }
    return undefined;
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    eventData?: Record<string, string | number | boolean | null | undefined>,
  ): Promise<boolean> {
    await apiClient.patch(`/owner/orders/${encodeURIComponent(orderId)}/status`, {
      status: status.toUpperCase(),
      ...eventData,
    });
    return true;
  },

  async addOrderNote(
    orderId: string,
    text: string,
    internal: boolean,
    _by: string,
  ): Promise<boolean> {
    await apiClient.post(`/owner/orders/${encodeURIComponent(orderId)}/notes`, {
      text,
      internal,
    });
    return true;
  },
};
