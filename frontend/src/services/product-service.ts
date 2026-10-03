import { apiClient, ApiResponse } from './api-client';
import { products as seedProducts } from '@/data/products';
import type {
  Product,
  ProductStatus,
  CreateProductPayload,
  ProductResponseData,
} from '@/types';

/**
 * Adapter helper to transform backend Product response into frontend domain model
 */
export function mapBackendProductToFrontend(item: any): Product {
  const images =
    item.images && item.images.length > 0
      ? item.images
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((img: any) => img.url)
      : [];

  const variants = (item.variants || []).map((v: any) => ({
    id: v.id,
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
  (item.variants || []).forEach((v: any) => {
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
    (c: any) => c.collection?.slug || c.collectionId || '',
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
    slug: item.slug,
    title: item.title,
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
    status?: ProductStatus;
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
      if (params?.status && params.status !== ('all' as any)) {
        searchParams.append('status', params.status.toUpperCase());
      }
      if (params?.search) {
        searchParams.append('search', params.search);
      }

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/owner/products?${queryString}` : '/owner/products';
      const res = await apiClient.get<any>(endpoint);
      const rawList = res?.data || res;

      if (Array.isArray(rawList)) {
        return rawList.map((item) => mapBackendProductToFrontend(item));
      }
      return [];
    } catch (err) {
      console.warn('Backend products fetch failed, falling back to local seed data:', err);
      // Fallback to local mock data
      let result = [...seedProducts];
      if (params?.status && params.status !== ('all' as any)) {
        result = result.filter((p) => p.status === params.status);
      }
      if (params?.category && params.category !== 'all') {
        result = result.filter((p) => p.category === params.category);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q),
        );
      }
      return result;
    }
  },

  /**
   * Get a single product by ID or Slug from backend
   */
  async getProductById(idOrSlug: string): Promise<Product | undefined> {
    try {
      const endpoint = `/owner/products/${idOrSlug}`;
      const res = await apiClient.get<any>(endpoint);
      const rawProduct = res?.data || res;
      if (rawProduct && rawProduct.id) {
        return mapBackendProductToFrontend(rawProduct);
      }
      return undefined;
    } catch {
      return seedProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    }
  },

  /**
   * Save or update product
   */
  async saveProduct(product: Product): Promise<Product> {
    try {
      if (product.id) {
        return await apiClient.put<Product>(`/owner/products/${product.id}`, product);
      }
      return await apiClient.post<Product>('/owner/products', product);
    } catch {
      return product;
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/owner/products/${id}`);
      return true;
    } catch {
      return true;
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
