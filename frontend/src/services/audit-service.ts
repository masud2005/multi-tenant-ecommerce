import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export interface AuditLogEntry {
  id: string;
  tenantId?: string;
  actor: string;
  action: string;
  resource: string;
  category: string;
  before?: string | null;
  after?: string | null;
  createdAt: string;
}

export interface QueryAuditParams {
  category?: string;
  actor?: string;
  action?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponseData {
  logs: AuditLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    categories: string[];
    actors: string[];
  };
}

export const auditService = {
  // Fetch paginated audit logs with search and category/actor filters
  async getAuditLogs(params?: QueryAuditParams): Promise<ApiResponse<AuditLogResponseData>> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'All') {
      searchParams.set('category', params.category);
    }
    if (params?.actor && params.actor !== 'All') {
      searchParams.set('actor', params.actor);
    }
    if (params?.action) {
      searchParams.set('action', params.action);
    }
    if (params?.search?.trim()) {
      searchParams.set('search', params.search.trim());
    }
    if (params?.page) {
      searchParams.set('page', String(params.page));
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();
    const endpoint = query ? `/owner/audit-logs?${query}` : '/owner/audit-logs';
    return await apiClient.get<ApiResponse<AuditLogResponseData>>(endpoint);
  },
};

