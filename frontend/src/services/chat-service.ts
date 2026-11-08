import { apiClient, ApiResponse } from './api-client';

export interface ChatMessage {
  id: string;
  conversationId: string;
  tenantId: string;
  senderId?: string | null;
  senderRole: 'CUSTOMER' | 'OWNER' | 'STAFF' | string;
  senderName: string;
  text: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId?: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: 'active' | 'resolved' | 'archived' | string;
  unreadByOwner: number;
  unreadByCustomer: number;
  lastMessageAt: string;
  lastMessagePreview?: string;
  lastMessageSenderRole?: string | null;
  createdAt: string;
}

export interface StartConversationPayload {
  conversationId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  initialMessage?: string;
}

export interface SendChatMessagePayload {
  text?: string;
  senderName?: string;
  senderRole?: 'CUSTOMER' | 'OWNER' | 'STAFF';
  attachments?: string[];
}

export interface ChatUploadResult {
  url: string;
  publicId: string;
  name: string;
  mimeType: string;
  size: number;
  resourceType: 'image' | 'raw' | 'video';
}

class ChatService {
  /**
   * 🛍️ 1. Start or resume customer live chat conversation
   */
  async initCustomerChat(payload: StartConversationPayload): Promise<Conversation | null> {
    try {
      const res = await apiClient.post<ApiResponse<Conversation> | Conversation>(
        '/customer/chat/init',
        payload,
      );
      if (res && 'data' in res) {
        return (res as any).data;
      }
      return (res as Conversation) || null;
    } catch (error) {
      console.error('Failed to init customer chat session:', error);
      return null;
    }
  }

  /**
   * 🛍️ 2. Get customer chat history (automatically decrypted)
   */
  async getCustomerMessages(
    conversationId: string,
  ): Promise<{ conversation: Conversation; messages: ChatMessage[] } | null> {
    try {
      const res = await apiClient.get<
        ApiResponse<{ conversation: Conversation; messages: ChatMessage[] }>
      >(`/customer/chat/conversations/${conversationId}/messages`);

      if (res && 'data' in res) {
        return (res as any).data;
      }
      return (res as any) || null;
    } catch (error) {
      console.error('Failed to get customer chat messages:', error);
      return null;
    }
  }

  /**
   * 🛍️ 3. Send encrypted message from customer
   */
  async sendCustomerMessage(
    conversationId: string,
    payload: SendChatMessagePayload,
  ): Promise<ChatMessage | null> {
    try {
      const res = await apiClient.post<ApiResponse<ChatMessage> | ChatMessage>(
        `/customer/chat/conversations/${conversationId}/messages`,
        payload,
      );
      if (res && 'data' in res) {
        return (res as any).data;
      }
      return (res as ChatMessage) || null;
    } catch (error) {
      console.error('Failed to send customer chat message:', error);
      return null;
    }
  }

  /**
   * 🛍️ 4. Mark customer messages as read
   */
  async markCustomerRead(conversationId: string): Promise<boolean> {
    try {
      await apiClient.patch(`/customer/chat/conversations/${conversationId}/read`, {});
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🏢 5. Get Owner Conversations list with decrypted last message previews
   */
  async getOwnerConversations(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: Conversation[]; meta: any }> {
    try {
      const searchParams = new URLSearchParams();
      if (query.status) searchParams.append('status', query.status);
      if (query.search) searchParams.append('search', query.search);
      if (query.page) searchParams.append('page', String(query.page));
      if (query.limit) searchParams.append('limit', String(query.limit));

      const queryString = searchParams.toString();
      const endpoint = `/owner/chat/conversations${queryString ? `?${queryString}` : ''}`;

      const res = await apiClient.get<ApiResponse<Conversation[]>>(endpoint);

      if (res && 'data' in res) {
        return {
          items: (res as any).data || [],
          meta: (res as any).meta || {},
        };
      }
      return { items: (res as any) || [], meta: {} };
    } catch (error) {
      console.error('Failed to fetch owner conversations:', error);
      return { items: [], meta: {} };
    }
  }

  /**
   * 🏢 6. Get Owner conversation messages
   */
  async getOwnerMessages(
    conversationId: string,
  ): Promise<{ conversation: Conversation; messages: ChatMessage[] } | null> {
    try {
      const res = await apiClient.get<
        ApiResponse<{ conversation: Conversation; messages: ChatMessage[] }>
      >(`/owner/chat/conversations/${conversationId}/messages`);

      if (res && 'data' in res) {
        return (res as any).data;
      }
      return (res as any) || null;
    } catch (error) {
      console.error('Failed to get owner chat messages:', error);
      return null;
    }
  }

  /**
   * 🏢 7. Send owner/staff reply
   */
  async sendOwnerMessage(
    conversationId: string,
    payload: SendChatMessagePayload,
  ): Promise<ChatMessage | null> {
    try {
      const res = await apiClient.post<ApiResponse<ChatMessage> | ChatMessage>(
        `/owner/chat/conversations/${conversationId}/messages`,
        payload,
      );
      if (res && 'data' in res) {
        return (res as any).data;
      }
      return (res as ChatMessage) || null;
    } catch (error) {
      console.error('Failed to send owner chat message:', error);
      return null;
    }
  }

  /**
   * 🏢 8. Update conversation status
   */
  async updateConversationStatus(conversationId: string, status: string): Promise<boolean> {
    try {
      await apiClient.patch(`/owner/chat/conversations/${conversationId}/status`, { status });
      return true;
    } catch (error) {
      console.error('Failed to update conversation status:', error);
      return false;
    }
  }

  /**
   * Upload chat attachment (customer or owner endpoint)
   */
  async uploadAttachment(
    file: File,
    role: 'customer' | 'owner' = 'customer',
  ): Promise<ChatUploadResult | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const endpoint =
        role === 'owner' ? '/owner/chat/upload' : '/customer/chat/upload';
      const res = await apiClient.post<ApiResponse<ChatUploadResult>>(
        endpoint,
        formData,
      );
      if (res && 'data' in res) {
        return (res as any).data || null;
      }
      return (res as any) || null;
    } catch (error) {
      console.error('Failed to upload chat attachment:', error);
      throw error;
    }
  }

  /**
   * Discard a pending chat attachment from Cloudinary (rollback before send).
   */
  async discardAttachment(
    publicIdOrUrl: string,
    role: 'customer' | 'owner' = 'customer',
    resourceType?: 'image' | 'raw' | 'video',
  ): Promise<boolean> {
    try {
      const endpoint =
        role === 'owner' ? '/owner/chat/upload' : '/customer/chat/upload';
      await apiClient.delete(endpoint, { publicIdOrUrl, resourceType });
      return true;
    } catch (error) {
      console.error('Failed to discard chat attachment:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();

export function isChatImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || url.includes('/image/upload/');
}

/** File picker filter — extensions first so OS dialogs (esp. Windows) default to allowed types only. */
export const CHAT_FILE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf';

export const CHAT_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const CHAT_ALLOWED_EXT = /\.(jpe?g|png|webp|gif|pdf)$/i;

export const CHAT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const CHAT_MAX_ATTACHMENTS = 4;

/** Returns an error message if the file is not allowed; otherwise null. */
export function validateChatAttachment(file: File): string | null {
  const mimeOk = file.type ? CHAT_ALLOWED_MIME.has(file.type) : false;
  const extOk = CHAT_ALLOWED_EXT.test(file.name);
  if (!mimeOk && !extOk) {
    return 'Only JPG, PNG, WebP, GIF, or PDF files are allowed';
  }
  if (file.size > CHAT_MAX_FILE_BYTES) {
    return 'File must be under 5 MB';
  }
  return null;
}
