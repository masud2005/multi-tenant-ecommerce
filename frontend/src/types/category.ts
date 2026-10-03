// Category domain model and API request/response contracts

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  isActive?: boolean;
  showInNav?: boolean;
  order?: number;
  parentId?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  isActive?: boolean;
  showInNav?: boolean;
  order?: number;
  parentId?: string | null;
}

export interface CategoryResponseData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  isActive: boolean;
  showInNav: boolean;
  order: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: CategoryResponseData[];
}
