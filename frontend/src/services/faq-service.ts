import { apiClient, ApiResponse } from './api-client';

export interface FaqItemModel {
  id: string;
  tenantId?: string;
  category: string;
  question: string;
  answer: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveFaqItemPayload {
  category: string;
  question: string;
  answer: string;
  order?: number;
}

class FaqService {
  // 1. Get all FAQs for Admin / Owner
  async getOwnerFaqs(category?: string): Promise<FaqItemModel[]> {
    try {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      const res = await apiClient.get<ApiResponse<FaqItemModel[]>>(`/owner/faq${query}`);
      return res.data || [];
    } catch (error) {
      console.error('Failed to fetch owner FAQs:', error);
      return [];
    }
  }

  // 2. Batch Save/Replace all FAQs for Owner
  async batchSaveFaqs(items: SaveFaqItemPayload[]): Promise<FaqItemModel[]> {
    const res = await apiClient.post<ApiResponse<FaqItemModel[]>>('/owner/faq/batch', {
      items,
    });
    return res.data || [];
  }

  // 3. Create a single FAQ item
  async createFaq(payload: SaveFaqItemPayload): Promise<FaqItemModel | null> {
    const res = await apiClient.post<ApiResponse<FaqItemModel>>('/owner/faq', payload);
    return res.data || null;
  }

  // 4. Update single FAQ item
  async updateFaq(id: string, payload: Partial<SaveFaqItemPayload>): Promise<FaqItemModel | null> {
    const res = await apiClient.patch<ApiResponse<FaqItemModel>>(`/owner/faq/${id}`, payload);
    return res.data || null;
  }

  // 5. Delete FAQ item
  async deleteFaq(id: string): Promise<boolean> {
    await apiClient.delete<ApiResponse<null>>(`/owner/faq/${id}`);
    return true;
  }

  // 6. Get Public FAQs for Customer Storefront
  async getCustomerFaqs(category?: string): Promise<FaqItemModel[]> {
    try {
      const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
      const res = await apiClient.get<ApiResponse<FaqItemModel[]>>(`/customer/faq${query}`);
      return res.data || [];
    } catch (error) {
      console.error('Failed to fetch customer storefront FAQs:', error);
      return [];
    }
  }
}

export const faqService = new FaqService();
