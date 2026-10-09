import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';

export interface CreateContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  orderNumber?: string;
  message: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  from: 'customer' | 'agent';
  name: string;
  text: string;
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  tenantId: string;
  customerId?: string;
  orderNumber?: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  messages: TicketMessage[];
}

export interface TicketListResponse {
  tickets: SupportTicketItem[];
  counts: {
    all: number;
    open: number;
    pending: number;
    resolved: number;
    closed: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const supportService = {
  // 1. Submit contact message from customer storefront
  async sendContactMessage(
    payload: CreateContactMessagePayload,
  ): Promise<ApiResponse<any>> {
    return await apiClient.post<ApiResponse<any>>('/customer/contact', payload);
  },

  // 2. Get all support tickets & customer messages (Admin)
  async getTickets(query?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<TicketListResponse>> {
    const params = new URLSearchParams();
    if (query?.status && query.status !== 'all') params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiClient.get<ApiResponse<TicketListResponse>>(
      `/owner/support/tickets${qs}`,
    );
  },

  // 3. Get single ticket with full message history
  async getTicketById(id: string): Promise<ApiResponse<SupportTicketItem>> {
    return await apiClient.get<ApiResponse<SupportTicketItem>>(
      `/owner/support/tickets/${id}`,
    );
  },

  // 4. Post admin reply
  async replyToTicket(
    id: string,
    reply: string,
  ): Promise<ApiResponse<SupportTicketItem>> {
    return await apiClient.post<ApiResponse<SupportTicketItem>>(
      `/owner/support/tickets/${id}/reply`,
      { reply },
    );
  },

  // 5. Update status
  async updateTicketStatus(
    id: string,
    status: string,
  ): Promise<ApiResponse<SupportTicketItem>> {
    return await apiClient.patch<ApiResponse<SupportTicketItem>>(
      `/owner/support/tickets/${id}/status`,
      { status },
    );
  },
};
