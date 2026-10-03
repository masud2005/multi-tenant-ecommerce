// Brand domain model and API request/response contracts

export interface BrandItem {
  id: string;
  tenantId?: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  _count?: {
    products: number;
  };
  productsCount?: number;
}

export interface CreateBrandPayload {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

export interface UpdateBrandPayload {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
}

export interface BrandResponseData extends BrandItem {
  products?: any[];
}
