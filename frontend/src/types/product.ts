export type CategoryKey =
  | 'women'
  | 'men'
  | 'kids'
  | 'accessories'
  | 'footwear'
  | (string & {});

export type ProductStatus = 'published' | 'draft' | 'archived';

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  salePrice?: number;
  stock: number;
  reserved: number;
  enabled: boolean;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: CategoryKey;
  subcategory: string;
  collections: string[];
  tags: string[];
  images: string[];
  price: number;
  salePrice?: number;
  cost: number;
  rating: number;
  reviewCount: number;
  sold: number;
  createdAt: string;
  status: ProductStatus;
  shortDescription: string;
  description: string;
  colors: ColorOption[];
  sizes: string[];
  variants: Variant[];
  specs: { label: string; value: string }[];
  isNew?: boolean;
  isBestseller?: boolean;
  preorder?: boolean;
  weightGrams: number;
  barcode: string;
}

// ==========================================
// Product API Payloads & Backend Response Types
// ==========================================

export interface CreateProductImagePayload {
  url: string;
  alt?: string;
  isCover?: boolean;
  order?: number;
}

export interface CreateProductVariantPayload {
  sku?: string;
  color: string;
  colorHex?: string;
  size: string;
  price: number;
  salePrice?: number;
  stock: number;
  enabled?: boolean;
  barcode?: string;
}

export interface CreateProductPayload {
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  price: number;
  salePrice?: number;
  cost?: number;
  weightGrams?: number;
  preorder?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  tags?: string[];
  specs?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  categoryId: string;
  subcategoryId?: string;
  brandId?: string;
  collectionIds?: string[];
  images?: CreateProductImagePayload[];
  variants?: CreateProductVariantPayload[];
  tenantId?: string;
}

export interface ProductResponseData {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  seoTitle: string | null;
  seoDescription: string | null;
  price: number | string;
  salePrice: number | string | null;
  cost: number | string;
  weightGrams: number;
  preorder: boolean;
  isNew: boolean;
  isBestseller: boolean;
  rating: number | string;
  reviewCount: number;
  sold: number;
  tags: string[];
  specs: Record<string, any> | null;
  categoryId: string;
  subcategoryId: string | null;
  brandId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    isCover: boolean;
    order: number;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    color: string;
    colorHex: string | null;
    size: string;
    price: number | string;
    salePrice: number | string | null;
    stock: number;
    enabled: boolean;
    barcode: string | null;
  }>;
  collections?: Array<{
    collectionId: string;
    collection: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}
