import { apiClient, ApiResponse } from './api-client';
import type {
  Product,
  ProductStatus,
  CreateProductPayload,
  ProductResponseData,
} from '@/types';

interface BackendProductImage {
  url?: string;
  order?: number;
}

interface BackendProductVariant {
  id?: string;
  sku?: string;
  color?: string;
  colorHex?: string | null;
  size?: string;
  price?: number | string;
  salePrice?: number | string | null;
  stock?: number | string;
  reserved?: number | string;
  enabled?: boolean;
}

interface BackendProduct {
  id: string;
  slug?: string;
  title?: string;
  images?: BackendProductImage[];
  variants?: BackendProductVariant[];
  specs?: Record<string, string | number | boolean | null> | null;
  collections?: Array<{ collection?: { slug?: string }; collectionId?: string }>;
  status?: string;
  brand?: { name?: string } | null;
  category?: { slug?: string } | null;
  categoryId?: string;
  subcategory?: { name?: string; slug?: string } | null;
  tags?: string[];
  price?: number | string;
  salePrice?: number | string | null;
  cost?: number | string;
  rating?: number | string;
  reviewCount?: number | string;
  sold?: number | string;
  createdAt?: string;
  shortDescription?: string | null;
  description?: string | null;
  isNew?: boolean;
  isBestseller?: boolean;
  preorder?: boolean;
  weightGrams?: number | string;
  barcode?: string | null;
}

/**
 * Adapter helper to transform backend Product response into frontend domain model
 */
export function mapBackendProductToFrontend(item: BackendProduct): Product {
  const images =
    item.images && item.images.length > 0
      ? item.images
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((img) => img.url || '')
      : [];

  const variants = (item.variants || []).map((v) => ({
    id: v.id || '',
    sku: v.sku || '',
    color: v.color || 'Standard',
    size: v.size || 'Free Size',
    price: Number(v.price),
    salePrice: v.salePrice !== null && v.salePrice !== undefined ? Number(v.salePrice) : undefined,
    stock: Number(v.stock || 0),
    reserved: Number(v.reserved || 0),
    enabled: v.enabled ?? true,
  }));

  // Extract unique colors and sizes from variants
  const colorsMap = new Map<string, string>();
  const sizesSet = new Set<string>();
  (item.variants || []).forEach((v) => {
    if (v.color) colorsMap.set(v.color, v.colorHex || '#000000');
    if (v.size) sizesSet.add(v.size);
  });
  const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
    name,
    hex,
  }));
  const sizes = Array.from(sizesSet);

  // Specs object to array of { label, value }
  const specs =
    item.specs && typeof item.specs === 'object'
      ? Object.entries(item.specs).map(([label, value]) => ({
          label,
          value: String(value),
        }))
      : [];

  const collections = (item.collections || []).map(
    (c) => c.collection?.slug || c.collectionId || '',
  );

  const rawStatus = (item.status || 'DRAFT').toLowerCase();
  const status: ProductStatus =
    rawStatus === 'published'
      ? 'published'
      : rawStatus === 'archived'
      ? 'archived'
      : 'draft';

  return {
    id: item.id,
    slug: item.slug || '',
    title: item.title || '',
    brand: item.brand?.name || 'Tanti Studio',
    category: item.category?.slug || item.categoryId || 'women',
    subcategory: item.subcategory?.name || item.subcategory?.slug || '',
    collections,
    tags: item.tags || [],
    images:
      images.length > 0
        ? images
        : [
            'https://raw.githubusercontent.com/masud2005/fashion-shop/HEAD/public/f00f02c2-3aa1-48e5-9485-304d964dcbb5.jpg',
          ],
    price: Number(item.price),
    salePrice: item.salePrice !== null && item.salePrice !== undefined ? Number(item.salePrice) : undefined,
    cost: Number(item.cost || 0),
    rating: Number(item.rating || 0),
    reviewCount: Number(item.reviewCount || 0),
    sold: Number(item.sold || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    status,
    shortDescription: item.shortDescription || '',
    description: item.description || '',
    colors: colors.length > 0 ? colors : [{ name: 'Standard', hex: '#000000' }],
    sizes: sizes.length > 0 ? sizes : ['Free Size'],
    variants,
    specs,
    isNew: Boolean(item.isNew),
    isBestseller: Boolean(item.isBestseller),
    preorder: Boolean(item.preorder),
    weightGrams: Number(item.weightGrams || 0),
    barcode: item.barcode || '',
  };
}

export const productService = {
  /**
   * Create a new product in the backend
   */
  async createProduct(
    payload: CreateProductPayload,
  ): Promise<ApiResponse<ProductResponseData>> {
    return await apiClient.post<ApiResponse<ProductResponseData>>(
      '/owner/products',
      payload,
    );
  },

  /**
   * Get all products from the backend with optional query filters
   */
  async getProducts(params?: {
    category?: string;
    subcategory?: string;
    brand?: string;
    collection?: string;
    status?: ProductStatus | 'all';
    search?: string;
  }): Promise<Product[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.category && params.category !== 'all') {
        searchParams.append('category', params.category);
      }
      if (params?.subcategory && params.subcategory !== 'all') {
        searchParams.append('subcategory', params.subcategory);
      }
      if (params?.brand && params.brand !== 'all') {
        searchParams.append('brand', params.brand);
      }
      if (params?.collection && params.collection !== 'all') {
        searchParams.append('collection', params.collection);
      }
      if (params?.status && params.status !== 'all') {
        searchParams.append('status', params.status.toUpperCase());
      }
      if (params?.search) {
        searchParams.append('search', params.search);
      }

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/owner/products?${queryString}` : '/owner/products';
      const res = await apiClient.get<ApiResponse<BackendProduct[]> | BackendProduct[]>(endpoint);
      const rawList = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(rawList)) {
        return rawList.map((item) => mapBackendProductToFrontend(item));
      }
      return [];
    } catch (err) {
      console.error('Backend products fetch failed:', err);
      return [];
    }
  },

  /**
   * Get a single product by ID or Slug from backend
   */
  async getProductById(idOrSlug: string): Promise<Product | undefined> {
    try {
      const endpoint = `/owner/products/${idOrSlug}`;
      const res = await apiClient.get<ApiResponse<BackendProduct> | BackendProduct>(endpoint);
      const rawProduct = res && typeof res === 'object' && 'data' in res ? res.data : res;
      if (rawProduct && rawProduct.id) {
        return mapBackendProductToFrontend(rawProduct);
      }
      return undefined;
    } catch {
      return undefined;
    }
  },

  /**
   * Update an existing product by ID or Slug in the backend
   */
  async updateProduct(
    idOrSlug: string,
    payload: Partial<CreateProductPayload>,
  ): Promise<ApiResponse<ProductResponseData>> {
    return await apiClient.patch<ApiResponse<ProductResponseData>>(
      `/owner/products/${idOrSlug}`,
      payload,
    );
  },

  /**
   * Save or update product helper
   */
  async saveProduct(product: Product): Promise<Product> {
    try {
      if (product.id) {
        const res = await apiClient.patch<ApiResponse<BackendProduct>>(`/owner/products/${product.id}`, product);
        return res?.data ? mapBackendProductToFrontend(res.data) : product;
      }
      const res = await apiClient.post<ApiResponse<BackendProduct>>('/owner/products', product);
      return res?.data ? mapBackendProductToFrontend(res.data) : product;
    } catch {
      return product;
    }
  },

  /**
   * Delete product by ID or Slug
   */
  async deleteProduct(idOrSlug: string): Promise<boolean> {
    try {
      await apiClient.delete(`/owner/products/${idOrSlug}`);
      return true;
    } catch (err) {
      console.error(`Failed to delete product ${idOrSlug}:`, err);
      throw err;
    }
  },

  /**
   * Adjust stock for a variant
   */
  async adjustStock(
    productId: string,
    variantId: string,
    delta: number,
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/owner/products/${productId}/variants/${variantId}/stock`, {
        delta,
      });
      return true;
    } catch {
      return true;
    }
  },
};
