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
  async getPublicPage(slug: string): Promise<AboutPageData | null> {
    try {
      const cleanSlug = slug.replace(/^\//, '');
      const res = await apiClient.get<ApiResponse<AboutPageData>>(`/customer/pages/${cleanSlug}`);
      return res.data || null;
    } catch (error) {
      console.error(`Failed to fetch public page '${slug}':`, error);
      return null;
    }
  }
}

export const pageService = new PageService();
