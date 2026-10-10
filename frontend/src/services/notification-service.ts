import { apiClient, ApiResponse } from './api-client';

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'INVENTORY' | 'PAYMENT' | 'SYSTEM' | string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface QueryNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

class NotificationService {
  /**
   * 1. Get current authenticated user's notifications and unread count
   */
  async getNotifications(params: QueryNotificationsParams = {}): Promise<NotificationListResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.unreadOnly !== undefined) searchParams.append('unreadOnly', String(params.unreadOnly));

      const queryString = searchParams.toString();
      const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

      const res = await apiClient.get<ApiResponse<NotificationListResponse> | NotificationListResponse>(endpoint);
      
      // Handle ApiResponse wrapper if present
      if (res && 'data' in res && (res as any).data?.items) {
        return (res as any).data;
      }
      return (res as NotificationListResponse) || { items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0, unreadCount: 0 } };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return {
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0, unreadCount: 0 },
      };
    }
  }

  /**
   * 2. Mark a single notification as read
   */
  async markAsRead(id: string): Promise<NotificationItem | null> {
    try {
      const res = await apiClient.patch<ApiResponse<NotificationItem> | NotificationItem>(`/notifications/${id}/read`, {});
      if (res && 'data' in res) {
        return (res as any).data;
      }
      return (res as NotificationItem) || null;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return null;
    }
  }

  /**
   * 3. Mark all unread notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.patch('/notifications/read-all', {});
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * 4. Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/notifications/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
