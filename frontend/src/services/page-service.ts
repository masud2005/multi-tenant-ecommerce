import { apiClient, ApiResponse } from './api-client';

export interface MilestoneItem {
  year: string;
  text: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface AboutPageData {
  id?: string | null;
  title: string;
  heading: string;
  heroImage: string;
  heroImageAlt?: string;
  storyParagraphs: string[];
  milestones: MilestoneItem[];
  stats: StatItem[];
  ctaText?: string;
  ctaLink?: string;
  status: 'published' | 'draft' | 'scheduled';
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: string;
  isDefault?: boolean;
}

export interface UpdateAboutPagePayload {
  title?: string;
  heading?: string;
  heroImage?: string;
  heroImageAlt?: string;
  storyParagraphs?: string[];
  milestones?: MilestoneItem[];
  stats?: StatItem[];
  ctaText?: string;
  ctaLink?: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ReturnSectionItem {
  heading: string;
  body: string;
}

export interface ReturnsPageData {
  id?: string | null;
  title: string;
  heading?: string;
  sections: ReturnSectionItem[];
  status: 'published' | 'draft';
  updatedAt?: string;
  isDefault?: boolean;
}

export interface UpdateReturnsPagePayload {
  title?: string;
  heading?: string;
  sections?: ReturnSectionItem[];
  status?: string;
}

export type PolicySlug =
  | 'returns'
  | 'shipping'
  | 'privacy'
  | 'terms'
  | 'cookies';

export type PolicyPageData = ReturnsPageData & {
  slug?: PolicySlug | string;
};

export type UpdatePolicyPagePayload = UpdateReturnsPagePayload;

class PageService {
  // 1. Get About Us page for Admin / Owner
  async getOwnerAboutPage(): Promise<AboutPageData | null> {
    try {
      const res = await apiClient.get<ApiResponse<AboutPageData>>('/owner/pages/about');
      return res.data || null;
    } catch (error) {
      console.error('Failed to fetch owner about page:', error);
      return null;
    }
  }

  // 2. Update About Us page for Admin / Owner
  async updateOwnerAboutPage(payload: UpdateAboutPagePayload): Promise<AboutPageData | null> {
    const res = await apiClient.put<ApiResponse<AboutPageData>>('/owner/pages/about', payload);
    return res.data || null;
  }

  // 3. Get all CMS pages for Admin / Owner
  async getOwnerPages(): Promise<any[]> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/owner/pages');
      return res.data || [];
    } catch (error) {
      console.error('Failed to fetch owner pages:', error);
      return [];
    }
  }

  // 4. Get Public page by slug for Storefront
  async getPublicPage<T = any>(slug: string): Promise<T | null> {
    try {
      const cleanSlug = slug.replace(/^\//, '');
      const res = await apiClient.get<ApiResponse<T>>(`/customer/pages/${cleanSlug}`);
      return res.data || null;
    } catch (error) {
      console.error(`Failed to fetch public page '${slug}':`, error);
      return null;
    }
  }

  // 5. Get Return page for Admin / Owner
  async getOwnerReturnsPage(): Promise<ReturnsPageData | null> {
    try {
      const res = await apiClient.get<ApiResponse<ReturnsPageData>>('/owner/pages/returns');
      return res.data || null;
    } catch (error) {
      console.error('Failed to fetch owner returns page:', error);
      return null;
    }
  }

  // 6. Update Return page for Admin / Owner
  async updateOwnerReturnsPage(payload: UpdateReturnsPagePayload): Promise<ReturnsPageData | null> {
    const res = await apiClient.put<ApiResponse<ReturnsPageData>>('/owner/pages/returns', payload);
    return res.data || null;
  }

  // 7. Get Public Return page for Storefront
  async getPublicReturnsPage(): Promise<ReturnsPageData | null> {
    return this.getPublicPage<ReturnsPageData>('returns');
  }

  // 8. Owner policy pages (returns, shipping, privacy, terms, cookies)
  async getOwnerPolicyPage(slug: PolicySlug): Promise<PolicyPageData | null> {
    try {
      const res = await apiClient.get<ApiResponse<PolicyPageData>>(
        `/owner/pages/policies/${encodeURIComponent(slug)}`,
      );
      return res.data || null;
    } catch (error) {
      console.error(`Failed to fetch owner policy '${slug}':`, error);
      return null;
    }
  }

  async updateOwnerPolicyPage(
    slug: PolicySlug,
    payload: UpdatePolicyPagePayload,
  ): Promise<PolicyPageData | null> {
    const res = await apiClient.put<ApiResponse<PolicyPageData>>(
      `/owner/pages/policies/${encodeURIComponent(slug)}`,
      payload,
    );
    return res.data || null;
  }
}

export const pageService = new PageService();
