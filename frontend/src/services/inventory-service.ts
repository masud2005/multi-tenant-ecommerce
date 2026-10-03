import { apiClient, ApiResponse } from './api-client';

export type StockAdjustmentType = 'ADD' | 'SUBTRACT' | 'SET';

export interface InventoryStats {
  totalVariants: number;
  totalStock: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryProductSummary {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  cost: number | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images?: Array<{
    url: string;
    alt?: string | null;
  }>;
}

export interface InventoryVariantItem {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  stock: number;
  reserved: number;
  lowStockThreshold: number | null;
  createdAt: string;
  updatedAt: string;
  product: InventoryProductSummary;
}

export interface InventoryOverviewData {
  stats: InventoryStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  items: InventoryVariantItem[];
}

export interface QueryInventoryParams {
  search?: string;
  stockStatus?: 'all' | 'low' | 'out';
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tenantId?: string;
}

export interface AdjustStockPayload {
  variantId: string;
  type: StockAdjustmentType;
  quantity: number;
  reason: string;
  ref?: string;
  note?: string;
  tenantId?: string;
}

export interface AdjustStockResponseData {
  variant: InventoryVariantItem;
  movement: {
    id: string;
    tenantId: string;
    variantId: string;
    change: number;
    stockBefore: number;
    stockAfter: number;
    reason: string;
    ref: string | null;
    note: string | null;
    by: string | null;
    createdAt: string;
  };
}

export const inventoryService = {
  /**
   * Get inventory stock overview, statistics, and variants
   */
  async getOverview(
    params?: QueryInventoryParams,
  ): Promise<ApiResponse<InventoryOverviewData>> {
    const query = new URLSearchParams();

    if (params?.search) query.append('search', params.search);
    if (params?.stockStatus && params.stockStatus !== 'all') {
      query.append('stockStatus', params.stockStatus);
    }
    if (params?.category && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params?.brand && params.brand !== 'all') {
      query.append('brand', params.brand);
    }
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params?.tenantId) query.append('tenantId', params.tenantId);

    const queryString = query.toString();
    const endpoint = queryString ? `/owner/inventory?${queryString}` : '/owner/inventory';

    return await apiClient.get<ApiResponse<InventoryOverviewData>>(endpoint);
  },

  /**
   * Adjust variant stock quantity with audit reason and note
   */
  async adjustStock(
    payload: AdjustStockPayload,
  ): Promise<ApiResponse<AdjustStockResponseData>> {
    return await apiClient.post<ApiResponse<AdjustStockResponseData>>(
      '/owner/inventory/adjust',
      payload,
    );
  },
};
