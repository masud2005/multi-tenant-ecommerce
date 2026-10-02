export interface BrandItem {
  id?: string;
  tenantId?: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
  productsCount?: number;
}
