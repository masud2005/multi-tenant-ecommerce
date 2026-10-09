import { apiClient } from './api-client';
import { authService } from './auth/auth.service';
import {
  salesSeries,
  kpis,
  funnel,
  salesByPayment,
  salesByRegion,
  salesByChannel,
  topSearches,
} from '@/data/analytics';

import { getAuthRole } from './auth/auth.storage';

export interface DistrictSalesItem {
  name: string;
  value: number;
}

export interface SearchQueryItem {
  term: string;
  count: number;
  results: number;
  clicks: number;
}

export interface AnalyticsOverviewResponse {
  salesByRegion: DistrictSalesItem[];
  salesSeries: { date: string; sales: number; prev: number; orders: number }[];
  salesByPayment: { name: string; value: number }[];
  salesByChannel: { name: string; value: number }[];
  kpis: {
    grossSales: number;
    netSales: number;
    orders: number;
    aov: number;
    productsSold: number;
    refunds: number;
    discounts: number;
    shippingRevenue: number;
    tax: number;
    conversionRate: number;
    cartAbandonment: number;
    returningRate: number;
  };
}

export const analyticsService = {
  // Check if current session belongs to an admin/owner
  isAdminUser(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const role = getAuthRole();
      if (role && ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },

  // Fetch real database aggregated sales by district
  async getSalesByDistrict(range: string = '30 days'): Promise<DistrictSalesItem[]> {
    try {
      const res: any = await apiClient.get(
        `/owner/analytics/sales-by-district?range=${encodeURIComponent(range)}`
      );
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return salesByRegion;
    } catch {
      return salesByRegion;
    }
  },

  // Fetch real top search queries from PostgreSQL
  async getTopSearches(): Promise<SearchQueryItem[]> {
    try {
      const res: any = await apiClient.get('/owner/analytics/top-searches');
      if (res && res.data && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Log intentional customer search query from storefront (Enter key, suggestion click)
  async logCustomerSearch(term: string, results: number = 0) {
    if (this.isAdminUser()) return; // Exclude admin from customer metrics

    const cleanTerm = term ? term.trim().toLowerCase() : '';
    if (!cleanTerm || cleanTerm.length < 2) return;

    try {
      return await apiClient.post('/customer/search/log', {
        term: cleanTerm,
        results,
      });
    } catch {
      // Non-blocking fire-and-forget
    }
  },

  // Log product click originating from a search term query
  async logProductClick(term: string) {
    if (this.isAdminUser()) return; // Exclude admin from customer metrics

    const cleanTerm = term ? term.trim().toLowerCase() : '';
    if (!cleanTerm || cleanTerm.length < 2) return;

    try {
      return await apiClient.post('/customer/search/click', {
        term: cleanTerm,
      });
    } catch {
      // Non-blocking fire-and-forget
    }
  },

  // Fetch full overview from PostgreSQL
  async getAnalyticsOverview(
    range: string = '30 days'
  ): Promise<AnalyticsOverviewResponse | null> {
    try {
      const res: any = await apiClient.get(
        `/owner/analytics/overview?range=${encodeURIComponent(range)}`
      );
      if (res && res.data) {
        return res.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  async getSalesSeries() {
    return salesSeries;
  },

  async getKpis() {
    return kpis;
  },

  async getFunnel() {
    return funnel;
  },

  async getSalesByPayment() {
    return salesByPayment;
  },

  async getSalesByChannel() {
    return salesByChannel;
  },
};
